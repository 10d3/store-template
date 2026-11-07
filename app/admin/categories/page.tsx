import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteCategory,
  upsertCategory,
} from "@/lib/admin/actions";
import { TermForm } from "@/components/admin/term-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const editing = edit ? categories.find((category) => category.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Top-level product groups used in navigation and filters.
        </p>
      </div>

      <TermForm action={upsertCategory} term={editing} label="category" />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        {categories.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{category.slug} · {category._count.products} products
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/categories?edit=${category.id}`}
                    className="rounded-md border border-border px-2 py-1 text-xs"
                  >
                    Edit
                  </Link>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmSubmit
                      message={`Delete ${category.name}? Products will become uncategorized.`}
                      className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive"
                    >
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
