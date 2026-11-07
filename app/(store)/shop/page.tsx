import Link from "next/link";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import {
  getCategories,
  getCollections,
  listProducts,
} from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";

interface ShopSearchParams {
  q?: string;
  category?: string;
  collection?: string;
  sort?: string;
  page?: string;
}

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const [categories, collections, result] = await Promise.all([
    getCategories(),
    getCollections(),
    listProducts({
      q: params.q,
      category: params.category,
      collection: params.collection,
      sort: params.sort,
      page,
    }),
  ]);

  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    if (params.collection) query.set("collection", params.collection);
    if (params.sort) query.set("sort", params.sort);
    query.set("page", String(nextPage));
    return `/shop?${query.toString()}`;
  };

  return (
    <Container className="py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl">Shop</h1>
        <p className="mt-2 text-muted-foreground">
          Everyday essentials, organized simply.
        </p>
      </div>

      <form className="mb-8 grid gap-3 rounded-xl border border-border/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search products"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm lg:col-span-2"
        />
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="collection"
          defaultValue={params.collection ?? ""}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.slug}>
              {collection.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={params.sort ?? "newest"}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/shop">Reset</Link>
          </Button>
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {result.total} {result.total === 1 ? "product" : "products"}
        </p>
        <p>
          Page {result.page} of {result.pageCount}
        </p>
      </div>

      {result.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">No products found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {result.page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page - 1)}>Previous</Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            {result.page} / {result.pageCount}
          </span>
          {result.page < result.pageCount && (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </Container>
  );
}
