
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

async function main() {
    const productId = 'prod_SIj7xyS1l39Bjg';
    console.log(`Fetching product ${productId}...`);

    try {
        const product = await stripe.products.retrieve(productId, {
            expand: ['default_price']
        });

        const price = product.default_price as any;
        const unitAmount = price?.unit_amount || 0;

        console.log(`Product: ${product.name}`);
        console.log(`Unit Price: $${(unitAmount / 100).toFixed(2)} (${unitAmount} cents)`);

        // Calculate Pack Prices based on user request
        // Size 2, 10% off
        const size2Price = unitAmount * 2;
        const size2Discount = Math.round(size2Price * 0.10);
        const size2Final = size2Price - size2Discount;

        console.log(`\nPack of 2 (10% off):`);
        console.log(`  Base: $${(size2Price / 100).toFixed(2)}`);
        console.log(`  Discount: -$${(size2Discount / 100).toFixed(2)}`);
        console.log(`  Final: $${(size2Final / 100).toFixed(2)} (${size2Final} cents)`);

        // Size 3, 20% off
        const size3Price = unitAmount * 3;
        const size3Discount = Math.round(size3Price * 0.20);
        const size3Final = size3Price - size3Discount;

        console.log(`\nPack of 3 (20% off):`);
        console.log(`  Base: $${(size3Price / 100).toFixed(2)}`);
        console.log(`  Discount: -$${(size3Discount / 100).toFixed(2)}`);
        console.log(`  Final: $${(size3Final / 100).toFixed(2)} (${size3Final} cents)`);

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
