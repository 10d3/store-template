import { randomBytes } from "node:crypto";

export function generateOrderNumber() {
  return `VIT-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}
