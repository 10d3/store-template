import { centsToDollars } from "@/lib/money";

export interface AdminVariant {
  id?: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  stock: string;
  trackInventory: boolean;
  active: boolean;
  options: string;
  image: string;
}

export interface AdminImage {
  url: string;
  alt: string;
}

export interface AdminProductFormData {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  featured: boolean;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
  images: AdminImage[];
  variants: AdminVariant[];
  collectionIds: string[];
}

export function variantToForm(variant: {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  stock: number;
  trackInventory: boolean;
  active: boolean;
  options: unknown;
  image: string | null;
}): AdminVariant {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? "",
    price: centsToDollars(variant.price),
    compareAtPrice: variant.compareAtPrice
      ? centsToDollars(variant.compareAtPrice)
      : "",
    cost: variant.cost ? centsToDollars(variant.cost) : "",
    stock: String(variant.stock),
    trackInventory: variant.trackInventory,
    active: variant.active,
    options:
      variant.options && Object.keys(variant.options as object).length > 0
        ? JSON.stringify(variant.options)
        : "",
    image: variant.image ?? "",
  };
}
