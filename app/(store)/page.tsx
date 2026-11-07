import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  listProducts,
} from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [featured, categories, collections, latest] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getCollections(),
    listProducts({ pageSize: 8 }),
  ]);

  const products = featured.length > 0 ? featured : latest.products;
  const heroImage = products[0]?.images[0]?.url;

  return (
    <>
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,var(--muted)_0%,var(--background)_100%)]">
        <Container className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Everyday wellness
            </p>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Good habits, made simple.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Thoughtful essentials for sleep, focus, and recovery — no noise,
              no complicated routines.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/shop">
                  Shop all products <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/about">Our story</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted md:aspect-[5/4]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Featured product"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Add a featured product in the admin
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="grid gap-4 border-b border-border/60 py-8 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Free shipping", copy: "On orders over $50" },
          { icon: ShieldCheck, title: "Secure checkout", copy: "Payments by Stripe" },
          { icon: PackageCheck, title: "Easy returns", copy: "30-day return window" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.copy}</p>
            </div>
          </div>
        ))}
      </Container>

      {products.length > 0 && (
        <Container className="py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl">Featured</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A short list of what we reach for most.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm underline-offset-4 hover:underline sm:block"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      )}

      {categories.length > 0 && (
        <section className="border-y border-border/60 bg-muted/30">
          <Container className="py-14">
            <h2 className="mb-8 font-serif text-3xl">Shop by category</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-background p-6 transition hover:border-foreground/30"
                >
                  <p className="font-serif text-xl">{category.name}</p>
                  {category.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1 text-sm">
                    Explore <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {collections.length > 0 && (
        <Container className="py-14">
          <h2 className="mb-8 font-serif text-3xl">Collections</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collection/${collection.slug}`}
                className="group flex items-center justify-between rounded-xl border border-border/60 p-6 transition hover:border-foreground/30"
              >
                <div>
                  <p className="font-medium">{collection.name}</p>
                  {collection.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
