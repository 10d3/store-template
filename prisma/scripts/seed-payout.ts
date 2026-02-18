/**
 * Script: seed-payout.ts
 * Creates a test commission + payout and fires the payout.process Inngest event.
 *
 * Usage:
 *   bun prisma/scripts/seed-payout.ts [affiliateId]
 *
 * If no affiliateId is passed, it picks the first ACTIVE affiliate.
 * It will create a fake referral + commission, then a payout, then fire the Inngest event.
 */

import { PrismaClient, PayoutStatus } from "../../lib/generated/prisma";
import { Inngest } from "inngest";

const prisma = new PrismaClient();
const inngest = new Inngest({ id: "my-app" });

const TEST_ORDER_VALUE = 1000;    // $100 test order
const TEST_COMMISSION_AMOUNT = 100; // $100 commission (10%)

async function main() {
    const affiliateId = process.argv[2];

    // ── 1. Find affiliate ──────────────────────────────────────────────────────
    let affiliate;
    if (affiliateId) {
        affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
        if (!affiliate) throw new Error(`No affiliate found with id: ${affiliateId}`);
    } else {
        affiliate = await prisma.affiliate.findFirst({ where: { status: "ACTIVE" } });
        if (!affiliate) throw new Error("No ACTIVE affiliate found. Create one first.");
    }

    console.log(`\n✅ Using affiliate: ${affiliate.id}`);
    console.log(`   Referral code:  ${affiliate.referralCode}`);
    console.log(`   Payment method: ${affiliate.paymentMethod}`);

    // ── 2. Create a fake referral ──────────────────────────────────────────────
    const referral = await prisma.referral.create({
        data: {
            affiliateId: affiliate.id,
            email: `test-seed-${Date.now()}@example.com`,
            status: "COMPLETED",
            orderValue: TEST_ORDER_VALUE,
            productId: "seed-test-product",
            productName: "Seed Test Product",
            ipAddress: "127.0.0.1",
            convertedAt: new Date(),
        },
    });

    console.log(`\n📋 Referral created: ${referral.id}`);

    // ── 3. Create a test commission (APPROVED) ─────────────────────────────────
    const commission = await prisma.commission.create({
        data: {
            affiliateId: affiliate.id,
            referralId: referral.id,
            amount: TEST_COMMISSION_AMOUNT,
            type: affiliate.commissionType ?? "PERCENTAGE",
            rate: affiliate.commissionRate ?? 10,
            status: "APPROVED",
            description: `[SEED] Test commission for $${TEST_ORDER_VALUE} order`,
        },
    });

    // Update affiliate balance to reflect the new commission
    await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
            totalConversions: { increment: 1 },
            totalEarnings: { increment: TEST_COMMISSION_AMOUNT },
            availableBalance: { increment: TEST_COMMISSION_AMOUNT },
            lifetimeEarnings: { increment: TEST_COMMISSION_AMOUNT },
        },
    });

    console.log(`� Commission created: ${commission.id} ($${TEST_COMMISSION_AMOUNT})`);

    // ── 4. Create the payout record ────────────────────────────────────────────
    const payout = await prisma.payout.create({
        data: {
            affiliateId: affiliate.id,
            amount: TEST_COMMISSION_AMOUNT,
            method: affiliate.paymentMethod ?? "STRIPE",
            status: PayoutStatus.PROCESSING,
        },
    });

    console.log(`\n📝 Payout created: ${payout.id} (status: PROCESSING)`);

    // ── 5. Fire the Inngest event ──────────────────────────────────────────────
    await inngest.send({
        name: "payout.process",
        data: { payoutId: payout.id },
    });

    console.log(`\n🚀 Inngest event "payout.process" sent`);
    console.log(`   → Watch it run at http://localhost:8288\n`);
}

main()
    .catch((e) => {
        console.error("\n❌ Error:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
