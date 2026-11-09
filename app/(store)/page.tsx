import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  listProducts,
} from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    title: "Wellness that fits your life",
    image: "/Gemini_Generated_Image_mjp7k2mjp7k2mjp7.png",
  },
  {
    title: "Restore your natural balance",
    image: "/Gemini_Generated_Image_b0aanbb0aanbb0aa.png",
  },
  {
    title: "Join the wellness journey",
    image: "/Gemini_Generated_Image_td0jdjtd0jdjtd0j.png",
  },
];

const tileGradients = [
  "from-[#e6eef1] to-[#c5d8df]",
  "from-[#efe6d8] to-[#d8c5ab]",
  "from-[#e8eae0] to-[#cbd2c2]",
  "from-[#f0e4e0] to-[#d8c0b8]",
];

export default async function HomePage() {
  const [featured, categories, collections, latest] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getCollections(),
    listProducts({ pageSize: 8 }),
  ]);

  const products = featured.length > 0 ? featured : latest.products;

  return (
    <>
      <section className="pt-6 md:pt-10">
        <Container>
          <div className="grid overflow-hidden rounded-[2rem] border bg-card shadow-sm md:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-center gap-6 p-8 md:p-14">
              <span className="w-fit rounded-full bg-leaf px-3 py-1 text-xs font-medium text-white">
                Simple. Natural. Effective.
              </span>
              <h1 className="max-w-xl font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
                Your vitality. Your rhythm. Your life.
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
                Natural support for energy, balance, and confidence — without
                compromise.
              </p>
              <Button
                asChild
                size="lg"
                className="w-fit rounded-full bg-brand px-8 hover:bg-brand/90"
              >
                <Link href="#products">
                  Start your wellness journey <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="relative min-h-[260px] bg-white md:min-h-[460px]">
              <Image
                src="/banner@3x.png"
                alt="Vitanou supplement range"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="hidden object-cover object-right md:block"
              />
              <Image
                src="/banner_stand@3x.png"
                alt="Vitanou supplement range"
                fill
                priority
                sizes="100vw"
                className="object-cover object-bottom md:hidden"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href="/shop"
                className="group relative h-[380px] overflow-hidden rounded-3xl"
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="max-w-[14rem] text-2xl font-medium leading-tight text-white drop-shadow">
                    {card.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
        <h2 className="font-serif text-4xl font-light tracking-tight text-balance md:text-7xl">
          Every body has a story.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
          We create natural support for the realities people live every day.
        </p>
      </section>

      {products.length > 0 && (
        <section id="products" className="scroll-mt-28">
          <Container>
            <h2 className="text-center font-serif text-3xl font-light md:text-4xl">
              Featured Products
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" className="rounded-full px-7">
                <Link href="/shop">
                  View all products <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mt-20 bg-muted/60 py-16 md:py-20">
          <Container>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-serif text-3xl font-light md:text-4xl">
                Shop by category
              </h2>
              <Link
                href="/shop"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
              >
                Browse everything
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className={cn(
                    "group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl p-7",
                    category.image ? "text-white" : "text-foreground"
                  )}
                >
                  {category.image ? (
                    <>
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <span className="absolute inset-0 bg-black/35" />
                    </>
                  ) : (
                    <span
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br transition duration-500 group-hover:scale-105",
                        tileGradients[index % tileGradients.length]
                      )}
                    />
                  )}
                  <div className="relative">
                    <h3 className="font-serif text-2xl font-light">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p
                        className={cn(
                          "mt-2 line-clamp-2 max-w-xs text-sm",
                          category.image ? "text-white/80" : "text-foreground/70"
                        )}
                      >
                        {category.description}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm">
                      Explore
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {collections.length > 0 && (
        <Container className="mt-20">
          <h2 className="mb-10 font-serif text-3xl font-light md:text-4xl">
            Collections
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collection/${collection.slug}`}
                className="group flex items-center justify-between gap-6 rounded-3xl border bg-card p-8 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <h3 className="font-serif text-2xl font-light">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border transition group-hover:bg-brand group-hover:text-white">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      )}

      <Container className="mt-20">
        <div className="rounded-[2rem] bg-brand px-8 py-14 text-center text-white md:py-20">
          <h2 className="mx-auto max-w-2xl font-serif text-4xl font-light tracking-tight text-balance md:text-6xl">
            Find your daily ritual.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Small, consistent habits are the foundation of a grounded life.
            Start with one product and build from there.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-full bg-white px-8 text-brand hover:bg-white/90"
          >
            <Link href="/shop">Shop all products</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
