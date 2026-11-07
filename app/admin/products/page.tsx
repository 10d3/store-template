import Image from "next/image";
import Link from "next/link";
import type { ProductStatus, Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { archiveProduct, deleteProduct, restoreProduct } from "@/lib/admin/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const metadata = { title: "Products" };

const statuses = ["", "DRAFT", "ACTIVE", "ARCHIVED"];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (status && statuses.includes(status)) where.status = status as ProductStatus;

  const products = await prisma.product.findMany({
    where,
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { orderBy: { position: "asc" } },
      category: true,
      _count: { select: { collections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} shown</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New product
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.slice(1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button className="h-9 rounded-md border border-border px-4 text-sm" type="submit">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
        {products.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">No products found.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Variants</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((product) => {
                const prices = product.variants.map((variant) => variant.price);
                const min = prices.length ? Math.min(...prices) : 0;
                const max = prices.length ? Math.max(...prices) : 0;
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                          {product.images[0] && (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt ?? product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{product.variants.length}</td>
                    <td className="px-4 py-3">
                      {min === max
                        ? formatMoney(min)
                        : `${formatMoney(min)} – ${formatMoney(max)}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-md border border-border px-2 py-1 text-xs"
                        >
                          Edit
                        </Link>
                        <form
                          action={
                            product.status === "ARCHIVED" ? restoreProduct : archiveProduct
                          }
                        >
                          <input type="hidden" name="id" value={product.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-border px-2 py-1 text-xs"
                          >
                            {product.status === "ARCHIVED" ? "Restore" : "Archive"}
                          </button>
                        </form>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={product.id} />
                          <ConfirmSubmit
                            message={`Delete ${product.name}? This also removes its variants and images.`}
                            className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive"
                          >
                            Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
