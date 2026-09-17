import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import type { CartItem } from "../store";

/**
 * Server-side guard against overselling. For every cart item that maps to a
 * ProductVariant (via stripePriceId or variantId) whose product has
 * `trackInventory` enabled, rejects the checkout if requested quantity exceeds
 * available stock.
 *
 * Fail-closed: unexpected DB errors abort checkout instead of silently skipping
 * enforcement (a transient failure must never enable overselling). The only
 * skip is for items genuinely without any resolvable product/variant, and the
 * pre-migration case where the ProductVariant table/columns don't exist yet.
 */
export async function assertStockAvailable(cart: CartItem[]): Promise<void> {
  const priceIds = cart
    .map((i) => i.stripePriceId)
    .filter((id): id is string => !!id);
  const variantIds = cart
    .map((i) => i.variantId)
    .filter((id): id is string => !!id);

  if (priceIds.length === 0 && variantIds.length === 0) return;

  let variants;
  try {
    variants = await prisma.productVariant.findMany({
      where: {
        OR: [
          ...(priceIds.length > 0
            ? [{ stripePriceId: { in: priceIds } }]
            : []),
          ...(variantIds.length > 0 ? [{ id: { in: variantIds } }] : []),
        ],
      },
      select: {
        id: true,
        stripePriceId: true,
        stock: true,
        product: { select: { trackInventory: true } },
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

  const byPrice = new Map(
    variants
      .filter((v): v is typeof v & { stripePriceId: string } => !!v.stripePriceId)
      .map((v) => [v.stripePriceId, v])
  );
  const byVariantId = new Map(variants.map((v) => [v.id, v]));

  for (const item of cart) {
    const v =
      (item.stripePriceId ? byPrice.get(item.stripePriceId) : undefined) ??
      (item.variantId ? byVariantId.get(item.variantId) : undefined);
    // Genuinely no resolvable product/variant — nothing to enforce for this item.
    if (!v) continue;
    if (v.product.trackInventory && v.stock < item.quantity) {
      throw new Error(
        v.stock <= 0
          ? `${item.name} is out of stock.`
          : `Only ${v.stock} left of ${item.name}.`
      );
    }
  }
}
