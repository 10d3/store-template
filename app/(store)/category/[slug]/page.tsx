import { notFound } from "next/navigation";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import { getCategoryBySlug, listProducts } from "@/lib/catalog/queries";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, result] = await Promise.all([
    getCategoryBySlug(slug),
    listProducts({ category: slug }),
  ]);

  if (!category) notFound();

  return (
    <Container className="py-12 md:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </p>
        <h1 className="mt-3 font-serif text-5xl font-light tracking-tight md:text-6xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {result.products.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Products will appear here once they are added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
