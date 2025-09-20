/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  price = price / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME = "node-handles-selected-style";

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
