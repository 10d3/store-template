import { sendMoney } from "../affiliation/send-money";
import PayoutConfirmationEmail from "@/components/mails/payout-confirmation-email";
import { emailService } from "../email/payout";
import { prisma } from "../prisma";
import { inngest } from "./client";

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

  async () => {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.payoutBatch.create({ data: {} });

      const affiliates = await tx.affiliate.findMany({
        where: { availableBalance: { gte: 50 } },
        select: { id: true, paymentMethod: true },
      });

      for (const a of affiliates) {
        const commissions = await tx.commission.findMany({
          where: {
            affiliateId: a.id,
            status: "APPROVED",
            payoutId: null,
          },
        });

        if (!commissions.length) continue;

        const amount = commissions.reduce((s, c) => s + c.amount, 0);

        const payout = await tx.payout.create({
          data: {
            affiliateId: a.id,
            amount,
            method: a.paymentMethod!,
            status: "PROCESSING",
            batchId: batch.id,
          },
        });

        await tx.commission.updateMany({
          where: { id: { in: commissions.map(c => c.id) } },
          data: { payoutId: payout.id, status: "PAID" },
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
      }

      return batch;
    });
  }
);

export const processPayout = inngest.createFunction(
  { id: "process-payout", concurrency: { limit: 2 } },
  { event: "payout.process" },

  async ({ event }) => {
    const payout = await prisma.payout.findUnique({
      where: { id: event.data.payoutId },
      include: { affiliate: true },
    });

    try {
      const txId = await sendMoney(payout?.affiliate.bankAccount!, payout!.affiliate.id!);

      await prisma.$transaction([
        prisma.payout.update({
          where: { id: payout!.id },
          data: { status: "COMPLETED", transactionId: txId?.id, completedAt: new Date() },
        }),
        prisma.ledgerEntry.create({
          data: {
            affiliateId: payout!.affiliateId,
            type: "PAYOUT_SENT",
            amount: payout!.amount,
            referenceType: "PAYOUT",
            referenceId: payout!.id,
          },
        }),
      ]);
    } catch (e) {
      await prisma.payout.update({
        where: { id: payout!.id },
        data: { status: "FAILED", failureReason: String(e) },
      });
    }
  }
);