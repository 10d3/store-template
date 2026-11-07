import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteCollection,
  upsertCollection,
} from "@/lib/admin/actions";
import { TermForm } from "@/components/admin/term-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const metadata = { title: "Collections" };

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const editing = edit
    ? collections.find((collection) => collection.id === edit)
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Collections</h1>
        <p className="text-sm text-muted-foreground">
          Curated groups such as “Best sellers” or “New arrivals”.
        </p>
      </div>

      <TermForm action={upsertCollection} term={editing} label="collection" />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        {collections.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No collections yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{collection.slug} · {collection._count.products} products
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/collections?edit=${collection.id}`}
                    className="rounded-md border border-border px-2 py-1 text-xs"
                  >
                    Edit
                  </Link>
                  <form action={deleteCollection}>
                    <input type="hidden" name="id" value={collection.id} />
                    <ConfirmSubmit
                      message={`Delete ${collection.name}?`}
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
