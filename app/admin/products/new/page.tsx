import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">New product</h1>
        <p className="text-sm text-muted-foreground">
          Add details, images, and at least one variant.
        </p>
      </div>
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
