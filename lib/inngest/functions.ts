import { sendMoney } from "../affiliation/send-money";
import { prisma } from "../prisma";
import { inngest } from "./client";
import { createCjOrder, getCjOrderDetail, confirmCjOrder } from "../cj/orders";
import { freightCalculate } from "../cj/logistics";
import { getCjVariantStock } from "../cj/inventory";
import { sendTrackingUpdate } from "../order/send-tracking";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "../catalog";

const PAYMENT_THRESHOLD = 50.0; // Minimum amount required for payout

// export const sendTransfer = inngest.createFunction(
//   { id: "send-transfer", concurrency:{ limit: 1 } },
//   { cron: "* * * * *" },
//   async ({ step }) => {
//     // load user that have affiliate
//     const users = await step.run(
//       "load-users",
//       async () =>
//         await prisma.affiliate.findMany({
//           where: {
//             bankAccount: {
//               not: null,
//             },
//             availableBalance: {
//               gte: PAYMENT_THRESHOLD,
//             },
//           },
//           include: {
//             user: true,
//           },
//         })
//     );

//     const events = users.map((user) => {
//       return {
//         name: "app/send.weekly.digest",
//         data: {
//           user_id: user.userId,
//           email: user.user.email,
//           bankAccount: user.bankAccount!,
//           availableBalance: user.availableBalance,
//           affiliateId: user.id,
//           paymentMethod: user.paymentMethod!,
//         },
//       };
//     });
//     await step.sendEvent("send-digest-events", events);
//   }
// );

// export const sendWeeklyDigest = inngest.createFunction(
//   { id: "send-weekly-digest-email", concurrency:{ limit: 1 } },
//   { event: "app/send.weekly.digest" },
//   async ({ event }) => {
//     // We can now grab the email and user id from the event payload
//     const { email } = event.data;

//     await sendMoney(
//       event.data.bankAccount,
//       // event.data.availableBalance,
//       event.data.affiliateId,
//       // event.data.paymentMethod
//     );

//     // Finally, we send the email itself:
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     const emailComponent = PayoutConfirmationEmail({
//       affiliateName: event.data.user?.name || "Affiliate",
//       amount: event.data.availableBalance,
//       bankAccount: event.data.bankAccount,
//       payoutDate: new Date(),
//       referralCount: event.data.referralCount, // optionnel
//       period: "Last 15 days", // optionnel
//     });

//     // Envoyer l'email
//     await emailService.send({
//       to: email,
//       subject: "💸 Your Payout Has Been Processed!",
//       react: emailComponent,
//     });
//   }
// );

export const payoutBatchJob = inngest.createFunction(
  {
    id: "daily-payout-batch",
    concurrency: { limit: 1 },
    // timeout: "30m",
  },
  { cron: "0 2 * * *" },

  async ({ step }) => {
    const result = await step.run("create-payout-batch", () =>
      prisma.$transaction(async (tx) => {
        const batch = await tx.payoutBatch.create({ data: {} });

        const affiliates = await tx.affiliate.findMany({
          where: { availableBalance: { gte: PAYMENT_THRESHOLD } },
          select: { id: true, paymentMethod: true, bankAccount: true },
        });

        const payoutIds: string[] = [];

        for (const a of affiliates) {
          // Only STRIPE transfers are implemented — skip the rest loudly.
          if (a.paymentMethod !== "STRIPE") {
            console.log(
              `[payout-batch] skipping affiliate ${a.id}: unsupported payment method ${a.paymentMethod}`
            );
            continue;
          }
          if (!a.bankAccount || !a.bankAccount.trim()) {
            console.log(`[payout-batch] skipping affiliate ${a.id}: missing bank account`);
            continue;
          }

          // Commissions stay APPROVED here — sendMoney claims them and marks
          // them PAID only after the Stripe transfer confirms.
          const commissions = await tx.commission.findMany({
            where: {
              affiliateId: a.id,
              status: "APPROVED",
              payoutId: null,
            },
            select: { id: true, amount: true },
          });

          if (!commissions.length) continue;

          const amount = commissions.reduce((s, c) => s + c.amount, 0);

          const payout = await tx.payout.create({
            data: {
              affiliateId: a.id,
              amount,
              method: "STRIPE",
              status: "PROCESSING",
              batchId: batch.id,
              // Claim contract for sendMoney: it must claim exactly this many
              // commissions or roll back (protects against concurrent
              // refunds/new commissions skewing the payout).
              notes: JSON.stringify({
                expectedCount: commissions.length,
                expectedAmount: amount,
              }),
            },
          });

          await tx.ledgerEntry.create({
            data: {
              affiliateId: a.id,
              type: "PAYOUT_HOLD",
              amount,
              referenceType: "PAYOUT",
              referenceId: payout.id,
            },
          });

          payoutIds.push(payout.id);
        }

        return { batchId: batch.id, payoutIds };
      })
    );

    // Emits the event that actually triggers processPayout/sendMoney.
    // step.sendEvent is memoized: retries won't duplicate events.
    if (result.payoutIds.length) {
      await step.sendEvent(
        "emit-payout-process",
        result.payoutIds.map((payoutId) => ({
          name: "payout.process",
          data: { payoutId },
        }))
      );
    }

    return result;
  }
);

export const processPayout = inngest.createFunction(
  { id: "process-payout", concurrency: { limit: 2 } },
  { event: "payout.process" },

  async ({ event, step }) => {
    const payoutId: string = event.data.payoutId;

    const payout = await step.run("load-payout", () =>
      prisma.payout.findUnique({
        where: { id: payoutId },
        include: { affiliate: true },
      })
    );

    // Crash-guard: never dereference a half-loaded payout/affiliate chain.
    if (!payout) {
      console.error(`[process-payout] payout ${payoutId} not found`);
      return;
    }
    if (!payout.affiliate?.bankAccount || !payout.affiliate.bankAccount.trim()) {
      await step.run("mark-failed-no-account", () =>
        prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: "FAILED",
            failureReason: "Affiliate has no Stripe bank account configured",
          },
        })
      );
      return;
    }

    try {
      // sendMoney owns the full pipeline — claim → transfer → finalize
      // (commissions PAID, payout COMPLETED with transfer id, PAYOUT_SENT
      // ledger) — and marks the payout FAILED + releases commissions if the
      // transfer didn't confirm. One step.run wraps all network/DB work;
      // replay-safety comes from sendMoney's COMPLETED short-circuit and the
      // stable Stripe idempotency key.
      await step.run("send-payout-transfer", () => sendMoney(payout.id));
    } catch (e) {
      // Safety net so a payout never sticks in PROCESSING.
      await prisma.payout.updateMany({
        where: { id: payout.id, status: "PROCESSING" },
        data: { status: "FAILED", failureReason: String(e) },
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// CJ Dropshipping — auto order placement (Phase 4)
// ─────────────────────────────────────────────────────────────────

const DEFAULT_CJ_LOGISTIC = "CJPacket Ordinary";

/**
 * Fired from the `checkout.session.completed` webhook. Resolves which line items
 * are CJ-sourced (via the Stripe price → ProductVariant → cjVariantId chain),
 * picks a shipping method, and creates the fulfillment order in CJ.
 *
 * Idempotent: skips if a CJ Fulfillment already exists for the order. Inngest
 * step memoization ensures the CJ order isn't created twice across retries.
 */
export const fulfillCjOrder = inngest.createFunction(
  { id: "cj-order-fulfill", concurrency: { limit: 1 }, retries: 4 },
  { event: "cj/order.fulfill" },

  async ({ event, step }) => {
    const { orderId } = event.data as {
      orderId: string;
      sessionId: string;
    };

    // 1. Load the order.
    const order = await step.run("load-order", () =>
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderLineItems: {
            include: {
              variant: {
                select: { id: true, cjVariantId: true, cjSku: true },
              },
            },
          },
        },
      })
    );
    if (!order) return { skipped: "order-not-found" };

    // 2. Idempotency — don't double-fulfill.
    const existing = await step.run("check-existing", () =>
      prisma.fulfillment.findFirst({ where: { orderId, provider: "CJ" } })
    );
    if (existing?.cjOrderId) return { skipped: "already-fulfilled" };

    // 3. Resolve CJ line items from the persisted order line items.
    const items = await step.run("resolve-cj-items", async () => {
      return order.orderLineItems.flatMap((li) => {
        const variant = li.variant;
        if (!variant?.cjVariantId) return [];
        return [
          {
            vid: variant.cjVariantId,
            quantity: li.quantity,
            sku: variant.cjSku ?? li.sku ?? undefined,
          },
        ];
      });
    });

    if (items.length === 0) return { skipped: "no-cj-items" };

    // 4. Parse the shipping address captured at checkout.
    type ShippingAddress = {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      name?: string;
    };
    let ship: ShippingAddress | null = null;

    if (order.shippingAddress) {
      try {
        ship = JSON.parse(order.shippingAddress) as ShippingAddress;
      } catch {
        ship = null;
      }
    }

    if (!ship?.country || !ship.line1) {
      await step.run("save-needs-address", () =>
        prisma.fulfillment.create({
          data: {
            orderId,
            provider: "CJ",
            status: "NEEDS_ADDRESS",
          },
        })
      );
      return { skipped: "missing-address" };
    }

    const fromCountry = process.env.CJ_FROM_COUNTRY_CODE ?? "CN";

    // 5. Pick the cheapest shipping method (fallback to a default).
    const logisticName = await step.run("pick-logistics", async () => {
      try {
        const options = await freightCalculate({
          startCountryCode: fromCountry,
          endCountryCode: ship.country!,
          zip: ship.postal_code,
          products: items.map((i) => ({ vid: i.vid, quantity: i.quantity })),
        });
        const cheapest = [...options].sort(
          (a, b) => (a.logisticPrice ?? Infinity) - (b.logisticPrice ?? Infinity)
        )[0];
        return cheapest?.logisticName ?? DEFAULT_CJ_LOGISTIC;
      } catch {
        return DEFAULT_CJ_LOGISTIC;
      }
    });

    // 6. Create the CJ order (step memoization makes this run exactly once).
    const result = await step.run("create-cj-order", () =>
      createCjOrder({
        orderNumber: order.orderNumber,
        shippingCountryCode: ship.country!,
        shippingProvince: ship.state ?? "",
        shippingCity: ship.city ?? "",
        shippingAddress: [ship.line1, ship.line2].filter(Boolean).join(", "),
        shippingCustomerName: ship.name ?? order.customerName ?? "Customer",
        shippingZip: ship.postal_code,
        logisticName,
        fromCountryCode: fromCountry,
        products: items,
      })
    );

    // 7. Auto-confirm (pay from CJ wallet) so the order actually ships.
    //    Insufficient balance / confirm errors are caught — the order stays
    //    CREATED and is flagged, rather than failing/retrying the whole job.
    const confirm = await step.run("confirm-cj-order", async () => {
      try {
        await confirmCjOrder(result.orderId);
        return { confirmed: true as const };
      } catch (e) {
        return {
          confirmed: false as const,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    });

    // 8. Persist the fulfillment.
    await step.run("save-fulfillment", async () => {
      // NEEDS_ADDRESS placeholders aren't caught by the idempotency check above.
      await prisma.fulfillment.deleteMany({
        where: {
          orderId,
          provider: "CJ",
          status: "NEEDS_ADDRESS",
          cjOrderId: null,
        },
      });
      return prisma.fulfillment.create({
        data: {
          orderId,
          provider: "CJ",
          cjOrderId: result.orderId,
          cjOrderNum: result.orderNumber ?? null,
          status: confirm.confirmed
            ? "CONFIRMED"
            : result.orderStatus ?? "CREATED",
          raw: JSON.parse(
            JSON.stringify({ create: result, confirm })
          ),
        },
      });
    });

    return {
      cjOrderId: result.orderId,
      items: items.length,
      confirmed: confirm.confirmed,
    };
  }
);

// ─────────────────────────────────────────────────────────────────
// CJ Dropshipping — tracking sync (Phase 5)
// ─────────────────────────────────────────────────────────────────

/**
 * Hourly poll of open CJ fulfillments. Pulls the latest status + tracking from
 * CJ; when a tracking number first appears, emails the customer. Idempotent:
 * the email only fires on the no-tracking → tracking transition (we persist the
 * tracking number, so later runs won't re-send).
 */
export const cjTrackingSync = inngest.createFunction(
  { id: "cj-tracking-sync", concurrency: { limit: 1 } },
  { cron: "0 * * * *" },

  async () => {
    const open = await prisma.fulfillment.findMany({
      where: {
        provider: "CJ",
        cjOrderId: { not: null },
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      orderBy: { updatedAt: "asc" },
      take: 50, // bounded per run — CJ is rate-limited to 1 req/sec
    });

    let updated = 0;
    let emailed = 0;

    for (const f of open) {
      try {
        const detail = await getCjOrderDetail(f.cjOrderId!);
        const track = detail.trackNumber || null;
        const carrier = detail.logisticName || f.carrier || null;
        const trackingUrl = track
          ? `https://t.17track.net/en#nums=${track}`
          : f.trackingUrl;
        const isNewTracking = !!track && !f.trackingNumber;

        // Email first; only persist trackingNumber once it succeeded,
        // otherwise the transition is consumed and the customer never gets mailed.
        let emailedOk = false;
        if (isNewTracking) {
          try {
            await sendTrackingUpdate({
              orderId: f.orderId,
              trackingNumber: track!,
              trackingUrl: trackingUrl ?? undefined,
              carrier: carrier ?? undefined,
            });
            emailed++;
            emailedOk = true;
          } catch (mailErr) {
            console.error(`[cj-tracking-sync] email failed for ${f.id}:`, mailErr);
          }
        }

        await prisma.fulfillment.update({
          where: { id: f.id },
          data: {
            status: detail.orderStatus ?? f.status,
            ...(emailedOk || !isNewTracking
              ? { trackingNumber: track ?? f.trackingNumber ?? undefined }
              : {}),
            carrier: carrier ?? undefined,
            trackingUrl: trackingUrl ?? undefined,
            raw: JSON.parse(JSON.stringify(detail)),
          },
        });
        updated++;
      } catch (err) {
        console.error(`[cj-tracking-sync] sync failed for ${f.id}:`, err);
      }
    }

    return { checked: open.length, updated, emailed };
  }
);

// ─────────────────────────────────────────────────────────────────
// CJ Dropshipping — inventory sync (Phase 6)
// ─────────────────────────────────────────────────────────────────

/**
 * Periodic refresh of CJ-sourced variant stock. Updates `ProductVariant.stock`
 * so the storefront (out-of-stock UI) and server-side checkout guard stay
 * accurate.
 *
 * Stock-only by design — we do NOT flip `active` here. Deactivating the last
 * active variant would empty `productVariants`, which would silently drop a CJ
 * product back to the legacy add-to-cart path (no stripePriceId → stock guard
 * skipped → oversell). Keeping variants active means stock=0 renders as
 * "Out of stock" and is still enforced at checkout. Admins control visibility.
 */
export const cjInventorySync = inngest.createFunction(
  { id: "cj-inventory-sync", concurrency: { limit: 1 } },
  { cron: "0 */6 * * *" },

  async () => {
    const variants = await prisma.productVariant.findMany({
      where: { cjVariantId: { not: null } },
      select: { id: true, cjVariantId: true, stock: true },
      orderBy: { updatedAt: "asc" },
      take: 200, // bounded per run — CJ is rate-limited to 1 req/sec
    });

    let updated = 0;

    // Explicit updatedAt bumps rotate this oldest-first window past
    // permanently-failing variants so they can't starve healthy ones.
    for (const v of variants) {
      try {
        const s = await getCjVariantStock(v.cjVariantId!);
        const stock =
          s.totalInventoryNum ??
          s.countryStockList?.reduce(
            (sum, r) => sum + (r.totalInventoryNum ?? 0),
            0
          ) ??
          0;

        if (stock !== v.stock) updated++;

        await prisma.productVariant.update({
          where: { id: v.id },
          data: { stock, updatedAt: new Date() },
        });
      } catch (err) {
        console.error(`[cj-inventory-sync] failed for variant ${v.id}:`, err);
        try {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { updatedAt: new Date() },
          });
        } catch {
          console.error(
            `[cj-inventory-sync] could not advance cursor for variant ${v.id}`
          );
        }
      }
    }

    if (updated > 0) revalidateTag(CATALOG_TAG, "everything");

    return { checked: variants.length, updated };
  }
);