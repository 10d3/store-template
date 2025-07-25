import PackCard from "@/components/shared/pack-card";
import ProductCard from "@/components/shared/product-card";
import { getTranslations } from "@/i18n/server";
// import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("test");
  console.log("translations", t("message"));
  const sampleProducts = [
    {
      id: "1",
      name: "PROZIS Creatine Creapure - Orange Flavor with Sweeteners",
      price: 24.49,
      originalPrice: 34.99,
      discount: 30,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center&sat=-100",
      },
    },
    {
      id: "2",
      name: "Whey Protein Isolate - Vanilla Flavor",
      price: 45.99,
      originalPrice: 59.99,
      discount: 25,
      image:
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center&brightness=1.2",
      },
    },
    {
      id: "3",
      name: "Pre-Workout Energy Boost - Berry Blast",
      price: 32.99,
      image:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop&crop=center&hue=30",
      },
    },
    {
      id: "4",
      name: "BCAA Recovery Formula - Tropical Punch",
      price: 28.99,
      originalPrice: 35.99,
      discount: 20,
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center&sat=1.5",
      },
    },
  ];
  const test = [
    {
      id: "1",
      name: "PROZIS Creatine Creapure - Orange Flavor with Sweeteners",
      price: 2449,
      originalPrice: 3499,
      discount: 30,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center&sat=-100",
      },
    },
    {
      id: "2",
      name: "Whey Protein Isolate - Vanilla Flavor",
      price: 4599,
      originalPrice: 5999,
      discount: 25,
      image:
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center&brightness=1.2",
      },
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {/* {t("home.title")} */}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {/* {t("home.subtitle")} */}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              // onAddToCart={() =>
              //   console.log(`Added product ${product.id} to cart`)
              // }
              className="hover:scale-105 transition-transform duration-200"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 pt-10">
          <PackCard products={test}/>
          <PackCard products={test}/>
        </div>
      </div>
    </div>
  );
}
