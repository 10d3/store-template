
// import Hero from "@/components/shared/hero";
import PackCard from "@/components/shared/pack-card";
import ProductCard from "@/components/shared/product-card";
import { PackCardNew } from "@/components/shared/product/product-card";
import { transformPacksToProductData } from "@/lib/product/pack-transformer";
// import { getTranslations } from "@/i18n/server";
import { listProducts, getProductsByProductIds } from "@/lib/product/crud";
import type { StripeProduct, ProductData } from "@/types/product";
import type { Metadata } from "next";
import NewHero from "@/components/shared/new-hero";
import { StoryText } from "@/components/shared/story-text";
import { Newsletter } from "@/components/shared/newsletter";

export const metadata: Metadata = {
  title: "Shop Premium Products | Our Store",
  description: "Discover our curated collection of premium products. Shop the latest arrivals, best sellers, and exclusive bundles with fast shipping.",
  openGraph: {
    title: "Shop Premium Products | Our Store",
    description: "Discover our curated collection of premium products. Shop the latest arrivals, best sellers, and exclusive bundles.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Premium Products | Our Store",
    description: "Discover our curated collection of premium products. Shop the latest arrivals, best sellers, and exclusive bundles.",
  },
};

export default async function Home() {
  // const t = await getTranslations("home");

  // Initialize arrays for products and packs
  let products: StripeProduct[] = [];
  let packs: StripeProduct[] = [];
  let packProductData: ProductData[] = [];

  try {
    const allProducts = await listProducts();

    // Separate regular products from packs
    products = allProducts.filter(
      (product) => !product.metadata?.type || product.metadata.type !== "bundle"
    );

    // All bundles
    const allPacks = allProducts.filter(
      (product) => product.metadata?.type === "bundle"
    );

    // Split: old-style packs (no pack_sizes) go to PackCard, new-style go to PackCardNew
    packs = allPacks.filter((pack) => !pack.metadata?.pack_sizes);

    // Transform packs WITH pack_sizes to ProductData format for PackCardNew
    const packsWithSizes = allPacks.filter((pack) => pack.metadata?.pack_sizes);
    packProductData = await transformPacksToProductData(packsWithSizes, products);
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
      slug: product.metadata?.slug,
    };
  });

  // Transform packs to component format
  const transformedPacks = await Promise.all(
    packs.map(async (pack) => {
      const packProducts = [];

      // If pack has contents metadata, fetch actual products
      if (pack.metadata?.contents) {
        const contentIds = pack.metadata.contents.split(",");
        try {
          const contentProducts = await getProductsByProductIds(contentIds);

          contentProducts.forEach((contentProduct, index) => {
            const defaultPrice =
              typeof contentProduct.default_price === "object" &&
                contentProduct.default_price
                ? contentProduct.default_price
                : null;

            packProducts.push({
              id: `${pack.id}_${contentProduct.id}`,
              name: contentProduct.name, // Use actual product name
              price: defaultPrice?.unit_amount || 0,
              image:
                contentProduct.images?.[0] ||
                pack.images?.[index] ||
                "/placeholder.svg",
              hoverMedia: contentProduct.images?.[1]
                ? {
                  type: "image" as const,
                  src: contentProduct.images[1],
                }
                : undefined,
              stripePriceId: defaultPrice?.id || contentIds[index]?.trim(),
            });
          });
        } catch (error) {
          console.error("Failed to fetch pack contents:", error);
          // Fallback to placeholder names if fetching fails
          contentIds.forEach((productId, index) => {
            packProducts.push({
              id: `${pack.id}_${index}`,
              name: `Product ${index + 1}`,
              price: Math.floor(Math.random() * 5000) + 1000,
              image: pack.images?.[index] || "/placeholder.svg",
              stripePriceId: productId.trim(),
            });
          });
        }
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
        price: pack.default_price,
        bundleDiscount: pack.metadata?.discount
          ? parseInt(pack.metadata.discount)
          : 0,
      };
    })
  );

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <NewHero />
        <StoryText
          headline="Every body has a story."
          description="We create natural support for the realities people live every day."
        />
        {/* Products Section */}
        {transformedProducts.length > 0 && (
          <div id="products" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
              {transformedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  image={product.image}
                  slug={product.slug}
                  hoverMedia={product.hoverMedia}
                  className="hover:scale-105 transition-transform duration-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Packs Section */}
        {(transformedPacks.length > 0 || packProductData.length > 0) && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Bundle Deals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {transformedPacks.map((pack) => (
                <PackCard
                  key={pack.id}
                  id={pack.id}
                  name={pack.name}
                  price={pack.price}
                  products={pack.products}
                  bundleDiscount={pack.bundleDiscount}
                  className="hover:scale-105 transition-transform duration-200"
                />
              ))}
              {packProductData.map((packData) => (
                <PackCardNew key={packData.id} product={packData} />
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

        <StoryText headline="You’re not alone in this."
          description="We’re here to educate, support, and walk this journey with you." />
        <Newsletter />
      </div>
    </div>
  );
}
