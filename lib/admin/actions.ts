"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/session";
import { transformTitletoSlug } from "@/lib/utils";
import { sendShippingEmail } from "@/lib/email";
import {
  FulfillmentStatus,
  OrderStatus,
  Prisma,
  ProductStatus,
} from "@/lib/generated/prisma";

export type ActionState = { error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function price(value: string): number | null {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function slugFor(name: string, provided: string) {
  return (provided || transformTitletoSlug(name)).trim();
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/collections");
}

export async function upsertCategory(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminAction();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugFor(name, text(formData, "slug"));

  if (!name || !slug) return { error: "Name and slug are required." };

  const duplicate = await prisma.category.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (duplicate) return { error: "That slug is already in use." };

  const data = {
    name,
    slug,
    description: optionalText(formData, "description"),
    image: optionalText(formData, "image"),
    position: Number.parseInt(text(formData, "position") || "0", 10) || 0,
  };

  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });

  revalidateCatalog();
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (id) await prisma.category.delete({ where: { id } });
  revalidateCatalog();
  redirect("/admin/categories");
}

export async function upsertCollection(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminAction();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugFor(name, text(formData, "slug"));

  if (!name || !slug) return { error: "Name and slug are required." };

  const duplicate = await prisma.collection.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (duplicate) return { error: "That slug is already in use." };

  const data = {
    name,
    slug,
    description: optionalText(formData, "description"),
    image: optionalText(formData, "image"),
    position: Number.parseInt(text(formData, "position") || "0", 10) || 0,
  };

  if (id) await prisma.collection.update({ where: { id }, data });
  else await prisma.collection.create({ data });

  revalidateCatalog();
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (id) await prisma.collection.delete({ where: { id } });
  revalidateCatalog();
  redirect("/admin/collections");
}

interface VariantInput {
  id?: string;
  title?: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string;
  cost?: string;
  stock?: string;
  trackInventory?: boolean;
  active?: boolean;
  options?: string;
  image?: string;
}

interface ParsedVariant {
  id?: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  stock: number;
  trackInventory: boolean;
  active: boolean;
  options: Prisma.InputJsonValue;
  image: string | null;
  position: number;
}

interface ImageInput {
  url?: string;
  alt?: string;
}

export async function upsertProduct(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminAction();

  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugFor(name, text(formData, "slug"));
  const status = text(formData, "status") as ProductStatus;
  const statuses = Object.values(ProductStatus);

  if (!name || !slug) return { error: "Name and slug are required." };
  if (!statuses.includes(status)) return { error: "Invalid product status." };

  const duplicate = await prisma.product.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (duplicate) return { error: "That slug is already in use." };

  let variants: VariantInput[];
  try {
    variants = JSON.parse(text(formData, "variants") || "[]");
  } catch {
    return { error: "Variants are malformed." };
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    return { error: "Add at least one variant." };
  }

  let images: ImageInput[];
  try {
    images = JSON.parse(text(formData, "images") || "[]");
  } catch {
    return { error: "Images are malformed." };
  }

  const parsedVariants: ParsedVariant[] = [];
  for (const [index, variant] of variants.entries()) {
    const unitPrice = price(variant.price ?? "");
    if (unitPrice === null) return { error: "Every variant needs a valid price." };
    const stock = Number.parseInt(variant.stock ?? "0", 10);
    if (!Number.isInteger(stock) || stock < 0) {
      return { error: "Stock must be zero or more." };
    }
    let options: Record<string, unknown> = {};
    if (variant.options?.trim()) {
      try {
        options = JSON.parse(variant.options);
      } catch {
        return { error: `Variant ${index + 1} has invalid options JSON.` };
      }
    }
    parsedVariants.push({
      id: variant.id || undefined,
      title: variant.title?.trim() || "Default",
      sku: variant.sku?.trim() || null,
      price: unitPrice,
      compareAtPrice: variant.compareAtPrice
        ? price(variant.compareAtPrice)
        : null,
      cost: variant.cost ? price(variant.cost) : null,
      stock,
      trackInventory: variant.trackInventory !== false,
      active: variant.active !== false,
      options: options as Prisma.InputJsonValue,
      image: variant.image?.trim() || null,
      position: index,
    });
  }

  const collectionIds = formData
    .getAll("collectionIds")
    .filter((value): value is string => typeof value === "string" && Boolean(value));

  const categoryId = optionalText(formData, "categoryId");
  const base = {
    name,
    slug,
    description: optionalText(formData, "description"),
    status,
    featured: bool(formData, "featured"),
    seoTitle: optionalText(formData, "seoTitle"),
    seoDescription: optionalText(formData, "seoDescription"),
  };
  const connection = collectionIds.map((collectionId) => ({ id: collectionId }));

  try {
    await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({
            where: { id },
            data: {
              ...base,
              collections: { set: connection },
              category: categoryId
                ? { connect: { id: categoryId } }
                : { disconnect: true },
            },
          })
        : await tx.product.create({
            data: {
              ...base,
              collections: { connect: connection },
              ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            },
          });

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images
            .filter((image) => Boolean(image.url?.trim()))
            .map((image, position) => ({
              productId: product.id,
              url: image.url!.trim(),
              alt: image.alt?.trim() || null,
              position,
            })),
        });
      }

      for (const variant of parsedVariants) {
        if (variant.id) {
          const { id: variantId, ...variantData } = variant;
          await tx.productVariant.update({
            where: { id: variantId },
            data: { ...variantData, productId: product.id },
          });
        } else {
          await tx.productVariant.create({
            data: { ...variant, productId: product.id },
          });
        }
      }

      const keptIds = parsedVariants
        .map((variant) => variant.id)
        .filter((value): value is string => Boolean(value));
      await tx.productVariant.deleteMany({
        where: {
          productId: product.id,
          ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
        },
      });
    });
  } catch (error) {
    console.error("[admin] product save failed:", error);
    return { error: "Could not save the product. Check that SKUs are unique." };
  }

  revalidateCatalog();
  revalidatePath(`/product/${slug}`);
  redirect("/admin/products");
}

export async function archiveProduct(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (id) {
    await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }
  revalidateCatalog();
  redirect("/admin/products");
}

export async function restoreProduct(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (id) {
    await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ACTIVE },
    });
  }
  revalidateCatalog();
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (id) await prisma.product.delete({ where: { id } });
  revalidateCatalog();
  redirect("/admin/products");
}

export async function updateOrder(formData: FormData) {
  await requireAdminAction();
  const id = text(formData, "id");
  if (!id) return;

  const status = text(formData, "status") as OrderStatus;
  const fulfillmentStatus = text(formData, "fulfillmentStatus") as FulfillmentStatus;
  if (
    !Object.values(OrderStatus).includes(status) ||
    !Object.values(FulfillmentStatus).includes(fulfillmentStatus)
  ) {
    return;
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      fulfillmentStatus,
      trackingNumber: optionalText(formData, "trackingNumber"),
      trackingUrl: optionalText(formData, "trackingUrl"),
      carrier: optionalText(formData, "carrier"),
    },
  });

  if (fulfillmentStatus === FulfillmentStatus.SHIPPED && order.trackingNumber) {
    await sendShippingEmail({
      email: order.email,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: order.carrier,
    }).catch((error) => console.error("[email] shipping email failed:", error));
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.orderNumber}`);
}
