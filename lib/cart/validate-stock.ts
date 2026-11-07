import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import type { CartItem } from "../store";

/**
 * Server-side guard against overselling. For every cart item that resolves to
 * a ProductVariant via `variantId` whose `trackInventory` is enabled, rejects
 * the checkout if requested quantity exceeds available stock.
 *
 * Fail-closed: unexpected DB errors abort checkout instead of silently skipping
 * enforcement (a transient failure must never enable overselling). The only
 * skip is for items genuinely without a resolvable variant, and the
 * pre-migration case where the ProductVariant table/columns don't exist yet.
 */
export async function assertStockAvailable(cart: CartItem[]): Promise<void> {
  const variantIds = cart
    .map((i) => i.variantId)
    .filter((id): id is string => !!id);

  if (variantIds.length === 0) return;

  let variants: { id: string; stock: number; trackInventory: boolean }[] = [];
  try {
    variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        stock: true,
        trackInventory: true, // moved from Product → ProductVariant in Phase 1 migration
      },
    });
  } catch (error) {
    // Pre-migration deploys only: table/column missing — nothing to enforce yet.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return;
    }
    // Any other DB failure must NOT silently skip stock enforcement.
    console.error("assertStockAvailable: stock lookup failed:", error);
    throw new Error(
      "Unable to verify stock availability right now. Please try again."
    );
  }

  const byVariantId = new Map(variants.map((v) => [v.id, v]));

  for (const item of cart) {
    const v = item.variantId ? byVariantId.get(item.variantId) : undefined;
    // Genuinely no resolvable variant — nothing to enforce for this item.
    if (!v) continue;
    if (v.trackInventory && v.stock < item.quantity) {
      throw new Error(
        v.stock <= 0
          ? `${item.name} is out of stock.`
          : `Only ${v.stock} left of ${item.name}.`
      );
    }
  }
}
