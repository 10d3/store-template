/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StripeProduct } from "@/types/product";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const getNestedValue = (obj: any, path: string): string => {
  return path.split(".").reduce((current, key) => current?.[key], obj) || "";
};

export const formatPrice = (price: number) => {
  // transfrom cent to dollar
  price = price / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME =
  "node-handles-selected-style";

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url);
}

export function duplicateContent(editor: any) {
  const { view, state } = editor;
  const { selection } = state;
  const { from, to } = selection;

  // Get the selected content
  const selectedContent = state.doc.cut(from, to);

  // Insert the duplicated content at the current selection
  editor.chain().focus().insertContentAt(to, selectedContent.toJSON()).run();
}

export const transformTitletoSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters except spaces and hyphens
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, "-") // Replace spaces with single hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
};

export const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }

  // Server-side: use environment variable
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export function generateReferralCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const getStripeLink = (url: string, data: string) => {
  return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${url}&state=${data}`;
};

type price = {
  id: string;
  unitAmount: number;
  currency: string;
  isDefault: boolean;
}
export function transformDbProduct(dbProduct: {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  metadata: unknown;
  slug: string | null;
  prices: price[];
  nutrition?: { nutrition: string } | null;
}): StripeProduct {
  const baseMetadata =
    (dbProduct.metadata as Record<string, string>) ?? {};

  const metadata = {
    ...baseMetadata,
    ...(dbProduct.nutrition?.nutrition && {
      nutrition: dbProduct.nutrition.nutrition,
    }),
  };

  const defaultPrice =
    dbProduct.prices.find((p) => p.isDefault) ?? dbProduct.prices[0];

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    images: dbProduct.images,
    active: dbProduct.active,
    metadata,
    slug: dbProduct.slug ?? undefined,
    default_price: defaultPrice
      ? {
        id: defaultPrice.id,
        unit_amount: defaultPrice.unitAmount,
        currency: defaultPrice.currency,
      }
      : null,
  };
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/__([^_]+)__/g, '$1') // Bold alt
    .replace(/_([^_]+)_/g, '$1') // Italic alt
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/>\s?/g, '') // Blockquotes
    .replace(/[-*+]\s/g, '') // List items
    .replace(/\n{2,}/g, ' ') // Multiple newlines
    .replace(/\n/g, ' ') // Single newlines
    .trim();
}