# Product Module Bug Fixes - Implementation Plan

## Executive Summary

This plan addresses **10 critical/high priority bugs** in the dual-storage architecture (Stripe → PostgreSQL sync) that cause product click errors and pack failures.

**Estimated Timeline**: 5-7 days
**Risk Level**: Medium (database schema changes required)
**Dependencies**: Prisma migration, Stripe API, existing product data

---

## Part 1: Critical Bugs (Must Fix First)

### Bug #1: Price Metadata Not Synced to Database

**Severity**: 🔴 Critical  
**Impact**: Pack size images fail to load; size lookups break  
**Location**: `lib/product/product-sync.ts:117-136`

#### Root Cause
```typescript
// CURRENT (BROKEN):
await prisma.price.upsert({
  where: { id: price.id },
  update: {
    image: price.metadata?.image || null,  // Only syncs image
    // MISSING: pack_size, generated_for metadata
  },
});
```

Stripe Price contains:
- `metadata.pack_size` - which pack size this price belongs to
- `metadata.generated_for` - "pack_size" marker
- `metadata.image` - pack-specific image URL

But only `image` is synced to DB. The `pack_size` metadata is **permanently lost**.

#### Fix Steps

**Step 1.1**: Add `metadata` field to Price model
```prisma
// prisma/schema.prisma
model Price {
  id        String  @id
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  unitAmount Int
  currency   String  @default("usd")
  active     Boolean @default(true)
  isDefault  Boolean @default(false)
  image      String?
  
  // ADD THIS:
  metadata   Json?   // Store all Stripe price metadata

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@index([active])
  @@index([productId, active])
  @@index([productId, isDefault])
  @@map("prices")
}
```

**Step 1.2**: Update syncPriceToDatabase
```typescript
// lib/product/product-sync.ts
export async function syncPriceToDatabase(
    price: Stripe.Price,
    isDefault: boolean = false
) {
    try {
        const productId =
            typeof price.product === "string" ? price.product : price.product.id;

        // If this is the default price, unset other defaults first
        if (isDefault) {
            await prisma.price.updateMany({
                where: { productId, isDefault: true },
                data: { isDefault: false },
            });
        }

        await prisma.price.upsert({
            where: { id: price.id },
            update: {
                unitAmount: price.unit_amount || 0,
                currency: price.currency,
                active: price.active,
                isDefault,
                image: price.metadata?.image || null,
                metadata: price.metadata ?? {},  // FIX: Sync ALL metadata
                updatedAt: new Date(),
            },
            create: {
                id: price.id,
                productId,
                unitAmount: price.unit_amount || 0,
                currency: price.currency,
                active: price.active,
                isDefault,
                image: price.metadata?.image || null,
                metadata: price.metadata ?? {},  // FIX: Sync ALL metadata
            },
        });

        return { success: true };
    } catch (error) {
        console.error(`❌ Error syncing price ${price.id}:`, error);
        return { success: false, error };
    }
}
```

**Step 1.3**: Update db-queries to select metadata
```typescript
// lib/product/db-queries.ts (multiple locations)
select: { 
    id: true, 
    unitAmount: true, 
    currency: true, 
    isDefault: true, 
    image: true,
    metadata: true,  // ADD THIS
},
```

Update all queries that select prices (lines 68, 98, 123, 163, 190, 216).

**Step 1.4**: Update transformDbProduct to include price metadata
```typescript
// lib/utils.ts
export function transformDbProduct(dbProduct: {
  // ... existing params
  prices: (price & { metadata?: Record<string, string> | null })[];
  // ...
}): StripeProduct {
  // ... existing code

  return {
    // ... existing fields
    prices: dbProduct.prices.map((p) => ({
      id: p.id,
      unit_amount: p.unitAmount,
      currency: p.currency,
      is_default: p.isDefault,
      image: p.image ?? null,
      metadata: p.metadata ?? {},  // FIX: Include metadata, not empty object
    })),
  };
}
```

**Step 1.5**: Run migration
```bash
npx prisma migrate dev --name add-price-metadata
npx prisma generate
```

**Step 1.6**: Resync all prices to populate metadata
```typescript
// scripts/resync-prices.ts (NEW FILE)
import Stripe from "stripe";
import { syncPriceToDatabase } from "@/lib/product/product-sync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function resyncAllPrices() {
  const prices = await stripe.prices.list({
    limit: 100,
    expand: ["data.product"],
  });

  for (const price of prices.data) {
    const product = price.product;
    const productId = typeof product === "string" ? product : product.id;
    
    // Check if this is the default price
    const fullProduct = await stripe.products.retrieve(productId);
    const isDefault = fullProduct.default_price === price.id;
    
    await syncPriceToDatabase(price, isDefault);
    console.log(`Synced price ${price.id}`);
  }

  console.log("Done!");
}

resyncAllPrices();
```

Run: `npx tsx scripts/resync-prices.ts`

#### Verification
```typescript
// Test that price metadata is retrieved
const products = await listProductsFromDB();
const pack = products.find(p => p.metadata?.type === "bundle");
const priceWithPackSize = pack?.prices?.find(p => p.metadata?.pack_size);
console.log("Pack size metadata:", priceWithPackSize?.metadata);
// Expected: { pack_size: "2", generated_for: "pack_size", image: "..." }
```

---

### Bug #2: getPacksFromDB Queries Wrong Field

**Severity**: 🔴 Critical  
**Impact**: Returns ZERO packs from database  
**Location**: `lib/product/db-queries.ts:175-198`

#### Root Cause
```typescript
// CURRENT (BROKEN):
where: {
    active: true,
    type: "bundle",  // ❌ Queries Product.type column (always NULL!)
}
```

The `type` column in the Product model is never populated. In Stripe, bundles have `metadata.type = "bundle"`, but sync only stores metadata as JSON.

#### Fix Steps

**Step 2.1**: Query metadata JSON field
```typescript
// lib/product/db-queries.ts:175-198
export async function getPacksFromDB(): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            active: true,
            // FIX: Query the metadata JSON field
            metadata: {
                path: ["type"],
                equals: "bundle",
            },
        },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 10,
                select: { 
                    id: true, 
                    unitAmount: true, 
                    currency: true, 
                    isDefault: true, 
                    image: true,
                    metadata: true,  // From Bug #1 fix
                },
            },
            nutrition: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return products.map(transformDbProduct);
}
```

**Alternative**: If JSON path queries are slow, add a computed column:
```prisma
// Add index on metadata->>'type'
@@index([active, type])  // If we populate type column during sync
```

**Step 2.2**: Update product-sync to populate type column
```typescript
// lib/product/product-sync.ts
export async function syncProductToDatabase(product: Stripe.Product) {
    try {
        const metadata = product.metadata as Record<string, string>;
        
        await prisma.product.upsert({
            where: { id: product.id },
            update: {
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
                // FIX: Extract commonly queried fields
                type: metadata.type || null,
                category: metadata.category || null,
                gender: metadata.gender || null,
                slug: metadata.slug || null,
                updatedAt: new Date(),
            },
            create: {
                id: product.id,
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
                type: metadata.type || null,
                category: metadata.category || null,
                gender: metadata.gender || null,
                slug: metadata.slug || null,
            },
        });

        // ... rest of sync logic
    } catch (error) {
        // ...
    }
}
```

#### Verification
```typescript
const packs = await getPacksFromDB();
console.log("Found packs:", packs.length);
// Expected: > 0 (should match actual bundles in Stripe)
```

---

### Bug #3: parsePackSizes Has No Fallback

**Severity**: 🔴 Critical  
**Impact**: Silent pack failures; bundles with malformed JSON break completely  
**Location**: `lib/product/pack-transformer.ts:225-238`

#### Root Cause
```typescript
// CURRENT (BROKEN):
function parsePackSizes(packSizesStr?: string): PackSizeConfig[] | null {
    if (!packSizesStr) return null;
    try {
        const parsed = JSON.parse(packSizesStr);
        if (Array.isArray(parsed)) {
            return parsed as PackSizeConfig[];
        }
    } catch (e) {
        console.error("Failed to parse pack_sizes:", e);  // Silent failure
    }
    return null;  // Returns null - caller may not handle
}
```

#### Fix Steps

**Step 3.1**: Add validation and fallback
```typescript
// lib/product/pack-transformer.ts
interface PackSizeConfig {
    size: number;
    enabled: boolean;
    discountPercent?: number;
    fixedPrice?: number;
    image?: string;
    stripePriceId?: string;
}

function parsePackSizes(packSizesStr?: string): PackSizeConfig[] {
    // Default fallback - single pack option
    const DEFAULT_PACK: PackSizeConfig = { size: 1, enabled: true };

    if (!packSizesStr) {
        console.warn("No pack_sizes metadata, using default single pack");
        return [DEFAULT_PACK];
    }

    try {
        const parsed = JSON.parse(packSizesStr);
        
        // Validate structure
        if (!Array.isArray(parsed)) {
            console.warn("pack_sizes is not an array, using default");
            return [DEFAULT_PACK];
        }

        if (parsed.length === 0) {
            console.warn("pack_sizes is empty, using default");
            return [DEFAULT_PACK];
        }

        // Validate each pack size config
        const validConfigs = parsed.filter(config => {
            if (typeof config.size !== 'number' || config.size < 1) {
                console.warn(`Invalid pack size: ${config.size}, skipping`);
                return false;
            }
            if (typeof config.enabled !== 'boolean') {
                console.warn(`Pack size ${config.size} missing enabled field, defaulting to true`);
                config.enabled = true;
            }
            return true;
        });

        if (validConfigs.length === 0) {
            console.warn("No valid pack_sizes, using default");
            return [DEFAULT_PACK];
        }

        return validConfigs as PackSizeConfig[];
    } catch (e) {
        console.error("Failed to parse pack_sizes JSON:", e);
        console.error("Raw pack_sizes value:", packSizesStr);
        return [DEFAULT_PACK];  // FIX: Return default instead of null
    }
}
```

**Step 3.2**: Update caller to handle validation
```typescript
// lib/product/pack-transformer.ts:29
export function transformPackToProductData(
    pack: StripeProduct,
    baseProduct?: StripeProduct | null
): ProductData | null {
    // ... existing code

    // Parse pack_sizes - now always returns array
    let packSizes = parsePackSizes(pack.metadata?.pack_sizes);
    
    // No need for null check anymore
    // The function always returns a valid array
}
```

#### Verification
```typescript
// Test with malformed JSON
const result = parsePackSizes('{invalid json}');
console.log("Result:", result);
// Expected: [{ size: 1, enabled: true }]

// Test with valid JSON
const valid = parsePackSizes('[{"size": 2, "enabled": true, "fixedPrice": 5000}]');
console.log("Valid:", valid);
// Expected: [{ size: 2, enabled: true, fixedPrice: 5000 }]
```

---

### Bug #4: Slug Field Confusion

**Severity**: 🟠 High  
**Impact**: Product lookups by slug may fail  
**Location**: `lib/product/cache.ts:50`, `lib/utils.ts:124`

#### Root Cause
- `getCachedProduct(slug)` filters by `product.metadata.slug`
- `transformDbProduct()` uses `dbProduct.slug` (top-level DB column)
- If slug only exists in one place, lookups fail

#### Fix Steps

**Step 4.1**: Unify slug handling - use DB column as source of truth
```typescript
// lib/product/cache.ts
export async function getCachedProduct(slug: string) {
    const products = await getCachedProducts();
    
    // FIX: Check both DB slug and metadata slug for compatibility
    const variants = products.filter(
        (product) => 
            product.slug === slug || 
            product.metadata?.slug === slug
    );
    return variants;
}
```

**Step 4.2**: Update StripeProduct interface
```typescript
// types/product.ts
export interface StripeProduct {
  id: string;
  name: string;
  description?: string | null;
  images?: string[];
  slug?: string;  // Top-level field (from DB)
  subtitle?: string | null;
  tagline?: string | null;
  metadata: Record<string, string>;  // May also contain slug
  default_price?: /* ... */ | null;
  active: boolean;
  variants?: StripeProductVariant[];
  prices?: /* ... */[];
}
```

**Step 4.3**: Ensure sync populates both
```typescript
// lib/product/product-sync.ts (from Bug #2 fix)
await prisma.product.upsert({
    where: { id: product.id },
    update: {
        // ...
        slug: metadata.slug || null,  // Populate DB column
    },
    create: {
        // ...
        slug: metadata.slug || null,
    },
});
```

#### Verification
```typescript
// Test slug lookup
const products = await getCachedProducts();
const product = products.find(p => p.slug === "some-product");
console.log("Found by slug:", product?.name);
```

---

## Part 2: High Priority Issues

### Bug #5: No Atomic Transactions in Pack Creation

**Severity**: 🟠 High  
**Impact**: Partial pack creation leaves inconsistent state  
**Location**: `lib/product/crud.ts:381-497`

#### Root Cause
`createPack` creates: product → price → pack size prices → metadata update. If any step fails after success, state is corrupted.

#### Fix Steps

**Step 5.1**: Wrap in Prisma transaction
```typescript
// lib/product/crud.ts
export async function createPack(data: PackFormData) {
    try {
        // ... metadata validation

        // FIX: Use transaction for atomic creation
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Stripe product
            const product = await stripe.products.create({
                name: data.name,
                description: data.description,
                images: data.images || [],
                metadata: validatedMetadata,
            });

            // 2. Create default price
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: data.packPrice,
                currency: "usd",
            });

            // 3. Set default price
            await stripe.products.update(product.id, {
                default_price: price.id,
            });

            // 4. Create pack size prices and collect price IDs
            let updatedPackSizes = data.packSizes;
            if (data.packSizes && data.packSizes.length > 0) {
                updatedPackSizes = await Promise.all(
                    data.packSizes.map(async (sizeConfig) => {
                        if (sizeConfig.enabled && sizeConfig.fixedPrice) {
                            const sizePrice = await stripe.prices.create({
                                product: product.id,
                                unit_amount: sizeConfig.fixedPrice,
                                currency: "usd",
                                metadata: {
                                    pack_size: sizeConfig.size.toString(),
                                    generated_for: "pack_size",
                                    image: sizeConfig.image || "",
                                },
                            });

                            return {
                                ...sizeConfig,
                                stripePriceId: sizePrice.id,
                            };
                        }
                        return sizeConfig;
                    })
                );

                // 5. Update metadata with price IDs
                await stripe.products.update(product.id, {
                    metadata: {
                        ...validatedMetadata,
                        pack_sizes: JSON.stringify(
                            updatedPackSizes.map(({ image, ...rest }) => rest)
                        ),
                    },
                });
            }

            // 6. Sync to database (within transaction)
            const finalProduct = await stripe.products.retrieve(product.id, {
                expand: ["default_price"],
            });
            
            await tx.product.upsert({
                where: { id: product.id },
                create: {
                    id: product.id,
                    name: finalProduct.name,
                    description: finalProduct.description || null,
                    images: finalProduct.images || [],
                    active: finalProduct.active,
                    metadata: finalProduct.metadata as object,
                    type: (finalProduct.metadata as any).type || null,
                    slug: (finalProduct.metadata as any).slug || null,
                },
                update: {
                    name: finalProduct.name,
                    description: finalProduct.description || null,
                    images: finalProduct.images || [],
                    active: finalProduct.active,
                    metadata: finalProduct.metadata as object,
                    type: (finalProduct.metadata as any).type || null,
                    slug: (finalProduct.metadata as any).slug || null,
                },
            });

            // 7. Sync prices to database
            if (updatedPackSizes && updatedPackSizes.length > 0) {
                for (const sizeConfig of updatedPackSizes) {
                    if (sizeConfig.stripePriceId) {
                        const sizePrice = await stripe.prices.retrieve(
                            sizeConfig.stripePriceId
                        );
                        await tx.price.upsert({
                            where: { id: sizePrice.id },
                            create: {
                                id: sizePrice.id,
                                productId: product.id,
                                unitAmount: sizePrice.unit_amount || 0,
                                currency: sizePrice.currency,
                                active: sizePrice.active,
                                isDefault: sizePrice.id === price.id,
                                image: sizePrice.metadata?.image || null,
                                metadata: sizePrice.metadata ?? {},
                            },
                            update: {
                                unitAmount: sizePrice.unit_amount || 0,
                                currency: sizePrice.currency,
                                active: sizePrice.active,
                                isDefault: sizePrice.id === price.id,
                                image: sizePrice.metadata?.image || null,
                                metadata: sizePrice.metadata ?? {},
                            },
                        });
                    }
                }
            }

            return product;
        });

        await revalidateProductCache();
        return transformProduct({
            ...result,
            default_price: (await stripe.prices.retrieve(
                typeof result.default_price === "string"
                    ? result.default_price
                    : result.default_price!.id
            )),
        });
    } catch (error) {
        // ... error handling
    }
}
```

**Note**: Stripe API calls can't be rolled back, but we can use webhooks to reconcile state. The transaction ensures DB is consistent.

---

### Bug #6: No Validation That ProductIds Exist

**Severity**: 🟠 High  
**Impact**: Packs reference non-existent products  
**Location**: `lib/product/crud.ts:381-397`

#### Fix Steps

```typescript
// lib/product/crud.ts
export async function createPack(data: PackFormData) {
    try {
        // FIX: Validate productIds exist before creating pack
        const existingProducts = await prisma.product.findMany({
            where: {
                id: { in: data.productIds },
                active: true,
            },
            select: { id: true, name: true },
        });

        if (existingProducts.length !== data.productIds.length) {
            const missingIds = data.productIds.filter(
                id => !existingProducts.some(p => p.id === id)
            );
            throw new ProductCrudError(
                `Products not found: ${missingIds.join(", ")}`,
                "PRODUCT_NOT_FOUND",
                { missingIds }
            );
        }

        // Continue with pack creation...
    } catch (error) {
        // ...
    }
}
```

---

### Bug #7: Currency Hardcoded to USD

**Severity**: 🟡 Medium  
**Impact**: International expansion blocked  
**Location**: `lib/product/crud.ts:423, 533`

#### Fix Steps

```typescript
// lib/product/product.schema.ts
export const packSchema = z.object({
    // ... existing fields
    currency: z.string().default("usd"),
});

// lib/product/crud.ts
const price = await stripe.prices.create({
    product: product.id,
    unit_amount: data.packPrice,
    currency: data.currency || "usd",  // FIX: Use form value
});
```

---

### Bug #8: tier_config JSON Not Validated

**Severity**: 🟡 Medium  
**Impact**: Malformed tier config breaks build-your-own pricing  
**Location**: `lib/product/product.schema.ts`

#### Fix Steps

```typescript
// lib/product/product.schema.ts
const tierConfigSchema = z.object({
    tiers: z.array(z.object({
        upTo: z.number().int().min(1),
        discountPercent: z.number().min(0).max(100),
    })),
    minItems: z.number().int().min(1).optional(),
    maxItems: z.number().int().min(1).optional(),
});

export const packSchema = z.object({
    // ... existing fields
    metadata: productMetadataSchema.extend({
        tier_config: z.string().refine(
            (val) => {
                try {
                    const parsed = JSON.parse(val);
                    return tierConfigSchema.safeParse(parsed).success;
                } catch {
                    return false;
                }
            },
            { message: "Invalid tier_config JSON structure" }
        ).optional(),
    }),
});
```

---

## Part 3: Testing & Verification

### Test Suite

Create comprehensive tests for all fixes:

```typescript
// __tests__/product-sync.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { syncPriceToDatabase } from "@/lib/product/product-sync";
import { prisma } from "@/lib/prisma";

describe("Price Metadata Sync", () => {
    it("should sync all price metadata to database", async () => {
        const mockPrice = {
            id: "price_test123",
            product: "prod_test123",
            unit_amount: 5000,
            currency: "usd",
            active: true,
            metadata: {
                pack_size: "2",
                generated_for: "pack_size",
                image: "https://example.com/image.jpg",
            },
        } as any;

        await syncPriceToDatabase(mockPrice, false);

        const dbPrice = await prisma.price.findUnique({
            where: { id: "price_test123" },
        });

        expect(dbPrice?.metadata).toEqual({
            pack_size: "2",
            generated_for: "pack_size",
            image: "https://example.com/image.jpg",
        });
    });
});

// __tests__/pack-transformer.test.ts
import { describe, it, expect } from "vitest";
import { parsePackSizes } from "@/lib/product/pack-transformer";

describe("Pack Size Parser", () => {
    it("should return default on malformed JSON", () => {
        const result = parsePackSizes('{invalid}');
        expect(result).toEqual([{ size: 1, enabled: true }]);
    });

    it("should return default on empty string", () => {
        const result = parsePackSizes("");
        expect(result).toEqual([{ size: 1, enabled: true }]);
    });

    it("should parse valid pack sizes", () => {
        const result = parsePackSizes(
            '[{"size": 2, "enabled": true, "fixedPrice": 5000}]'
        );
        expect(result).toEqual([
            { size: 2, enabled: true, fixedPrice: 5000 },
        ]);
    });

    it("should filter invalid pack sizes", () => {
        const result = parsePackSizes(
            '[{"size": -1, "enabled": true}, {"size": 2, "enabled": true}]'
        );
        expect(result).toEqual([{ size: 2, enabled: true }]);
    });
});

// __tests__/db-queries.test.ts
import { describe, it, expect } from "vitest";
import { getPacksFromDB } from "@/lib/product/db-queries";

describe("Pack Queries", () => {
    it("should return packs with metadata.type = bundle", async () => {
        const packs = await getPacksFromDB();
        
        expect(packs.length).toBeGreaterThan(0);
        packs.forEach(pack => {
            expect(pack.metadata?.type).toBe("bundle");
        });
    });

    it("should include price metadata for pack sizes", async () => {
        const packs = await getPacksFromDB();
        const packWithSizes = packs.find(p => p.metadata?.pack_sizes);
        
        if (packWithSizes?.prices) {
            const priceWithMetadata = packWithSizes.prices.find(
                p => p.metadata?.pack_size
            );
            expect(priceWithMetadata?.metadata?.pack_size).toBeDefined();
        }
    });
});
```

---

## Part 4: Rollback Procedures

### Rollback Plan

1. **Database Schema Rollback**
   ```bash
   npx prisma migrate rollback
   ```

2. **Code Rollback**
   ```bash
   git revert <commit-hash>
   ```

3. **Resync Products** (if needed)
   ```bash
   npx tsx scripts/sync-all-products.ts
   ```

### Monitoring Post-Deployment

1. Check pack pages load correctly
2. Verify pack images display
3. Test pack size selection
4. Monitor error rates in production

---

## Implementation Order

### Week 1: Critical Bugs

1. **Day 1-2**: Bug #1 (Price metadata sync)
   - Schema migration
   - Update sync functions
   - Resync existing data

2. **Day 3**: Bug #2 (Pack query fix)
   - Update getPacksFromDB
   - Update product-sync to populate columns

3. **Day 4**: Bug #3 (Pack sizes fallback)
   - Update parsePackSizes
   - Add validation

4. **Day 5**: Bug #4 (Slug unification)
   - Update cache.ts
   - Update transformDbProduct

### Week 2: High Priority & Testing

5. **Day 6**: Bug #5 (Atomic transactions)
   - Refactor createPack/updatePack
   - Add transaction wrapper

6. **Day 7**: Bug #6-8 (Validation improvements)
   - ProductId validation
   - Currency support
   - Tier config validation

7. **Day 8-10**: Testing & Verification
   - Write test suite
   - Manual QA testing
   - Performance testing

---

## Files to Modify

### Schema Changes
- `prisma/schema.prisma` - Add Price.metadata field

### Core Fixes
- `lib/product/product-sync.ts` - Sync price metadata, populate columns
- `lib/product/db-queries.ts` - Fix pack query, select metadata
- `lib/product/pack-transformer.ts` - Add pack sizes validation
- `lib/product/crud.ts` - Add transactions, validation
- `lib/product/cache.ts` - Fix slug lookup
- `lib/utils.ts` - Include price metadata in transform

### New Files
- `scripts/resync-prices.ts` - Resync price metadata
- `__tests__/product-sync.test.ts` - Test price sync
- `__tests__/pack-transformer.test.ts` - Test pack parsing
- `__tests__/db-queries.test.ts` - Test database queries

---

## Success Criteria

- [ ] All packs load without errors
- [ ] Pack size images display correctly
- [ ] Price metadata persists across syncs
- [ ] Slug lookups work consistently
- [ ] All tests pass
- [ ] No regression in existing functionality
