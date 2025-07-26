import PackCard from "@/components/shared/pack-card";
import ProductCard from "@/components/shared/product-card";
// import { getTranslations } from "@/i18n/server";
import { listProducts } from "@/lib/product/crud";
import type { StripeProduct } from "@/types/product";

export default async function Home() {
  // const t = await getTranslations("home");

  // Initialize arrays for products and packs
  let products: StripeProduct[] = [];
  let packs: StripeProduct[] = [];

  try {
    const allProducts = await listProducts();

    // Separate regular products from packs
    products = allProducts.filter(
      (product) => !product.metadata?.type || product.metadata.type !== "bundle"
    );

    packs = allProducts.filter(
      (product) => product.metadata?.type === "bundle"
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }

  // Transform Stripe products to component format
  const transformedProducts = products.map((product) => {
    // Type guard for default_price
    const defaultPrice =
      typeof product.default_price === "object" && product.default_price
        ? product.default_price
        : null;

    return {
      id: product.id,
      name: product.name,
      price: defaultPrice?.unit_amount || 0,
      originalPrice: product.metadata?.original_price
        ? parseInt(product.metadata.original_price)
        : undefined,
      discount: product.metadata?.discount_percent
        ? parseInt(product.metadata.discount_percent)
        : undefined,
      image: product.images?.[0] || "/placeholder.svg",
      hoverMedia: product.images?.[1]
        ? {
            type: "image" as const,
            src: product.images[1],
          }
        : undefined,
      stripePriceId:
        defaultPrice?.id ||
        (typeof product.default_price === "string"
          ? product.default_price
          : undefined),
    };
  });

  // Transform packs to component format
  const transformedPacks = packs.map((pack) => {
    const packProducts = [];

    // If pack has contents metadata, parse it
    if (pack.metadata?.contents) {
      const contentIds = pack.metadata.contents.split(",");
      // For now, create sample products - in a real app you'd fetch these by price IDs
      contentIds.forEach((priceId, index) => {
        packProducts.push({
          id: `${pack.id}_${index}`,
          name: `Product ${index + 1}`,
          price: Math.floor(Math.random() * 5000) + 1000, // Random price for demo
          image: pack.images?.[index] || "/placeholder.svg",
          stripePriceId: priceId.trim(),
        });
      });
    } else {
      // Default pack content if no metadata
      const defaultPrice =
        typeof pack.default_price === "object" && pack.default_price
          ? pack.default_price
          : null;

      packProducts.push({
        id: `${pack.id}_1`,
        name: pack.name,
        price: defaultPrice?.unit_amount || 0,
        image: pack.images?.[0] || "/placeholder.svg",
        stripePriceId:
          defaultPrice?.id ||
          (typeof pack.default_price === "string"
            ? pack.default_price
            : undefined),
      });
    }

    return {
      id: pack.id,
      name: pack.name, // Use the pack name directly
      products: packProducts,
      bundleDiscount: pack.metadata?.discount
        ? parseInt(pack.metadata.discount)
        : 0,
    };
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our premium products and exclusive bundle deals
          </p>
        </div>

        {/* Products Section */}
        {transformedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {transformedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  className="hover:scale-105 transition-transform duration-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Packs Section */}
        {transformedPacks.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Bundle Deals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {transformedPacks.map((pack) => (
                <PackCard
                  key={pack.id}
                  {...pack}
                  className="hover:scale-105 transition-transform duration-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Fallback when no products */}
        {transformedProducts.length === 0 && transformedPacks.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No Products Available</h2>
            <p className="text-gray-600 mb-8">
              Please add some products in the admin panel to see them here.
            </p>
            <a
              href="/admin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go to Admin Panel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
