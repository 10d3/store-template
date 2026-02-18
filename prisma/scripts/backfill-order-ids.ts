/**
 * One-time script to backfill existing orders that have numeric orderNumber values
 * with the new VIT-XXXXXX format.
 *
 * Run with: bun run prisma/scripts/backfill-order-ids.ts
 */
import { PrismaClient } from "../../lib/generated/prisma";
import { generateOrderId } from "../../lib/order-id";

const prisma = new PrismaClient();

async function main() {
    // Find orders whose orderNumber looks like a plain integer (no VIT- prefix)
    const orders = await prisma.order.findMany({
        where: {
            NOT: {
                orderNumber: {
                    startsWith: "VIT-",
                },
            },
        },
        select: { id: true, orderNumber: true },
    });

    console.log(`Found ${orders.length} orders to backfill.`);

    for (const order of orders) {
        let newId: string;
        let attempts = 0;

        // Retry in the unlikely case of a collision
        while (true) {
            newId = generateOrderId();
            const existing = await prisma.order.findUnique({
                where: { orderNumber: newId },
            });
            if (!existing) break;
            if (++attempts > 10) throw new Error("Too many collisions generating order ID");
        }

        await prisma.order.update({
            where: { id: order.id },
            data: { orderNumber: newId! },
        });

        console.log(`  ${order.id}: ${order.orderNumber} → ${newId!}`);
    }

    console.log("Backfill complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
