import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ProductForm,
  variantToForm,
  type AdminProductFormData,
} from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
        collections: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  const initial: AdminProductFormData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    status: product.status,
    featured: product.featured,
    categoryId: product.categoryId ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    images: product.images.map((image) => ({ url: image.url, alt: image.alt ?? "" })),
    variants: product.variants.map(variantToForm),
    collectionIds: product.collections.map((collection) => collection.id),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Edit product</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        product={initial}
        categories={categories}
        collections={collections}
      />
    </div>
  );
}
