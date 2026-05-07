# Product Module Robustness & Performance Plan

## Executive Summary

This plan addresses critical issues in `lib/product/`, `lib/store/`, and `app/` directories to improve robustness, performance, and maintainability. The analysis identified **7 critical issues**, **12 high priority issues**, and **8 medium priority issues** across caching, error handling, database queries, type safety, and testing.

---

## Part 1: Critical Fixes (Do First)

### 1.1 Fix Memory Leaks in In-Memory Caches

**Problem**: Multiple in-memory caches grow unbounded and never invalidate.

**Files**:
- `lib/product/db-queries.ts:201` - `productCache` Map
- `lib/product/related-index.ts:8-10` - Module-level indexes
- `lib/product/bundle-index.ts:9` - `bundleIndex` Map
- `lib/product/test-index-product.ts:42` - `slugIndex` Map

**Solution**:
```typescript
// Option A: Use LRU cache with TTL
import { LRUCache } from 'lru-cache';

const productCache = new LRUCache<string, StripeProduct>({
  max: 500,           // Max 500 items
  ttl: 5 * 60 * 1000,  // 5 minutes
  allowStale: true,
});

// Option B: Remove in-memory caches entirely, rely on Next.js cache + DB indexes
// Recommended for serverless environments
```

**Effort**: Medium (2-3 hours)

---

### 1.2 Fix Cache Revalidation Bug

**Problem**: Invalid parameter passed to `revalidateTag()`.

**File**: `lib/product/cache.ts:41`

**Current**:
```typescript
export async function revalidateProductCache() {
  revalidateTag("products", "max");  // "max" is not a valid parameter
}
```

**Fix**:
```typescript
export async function revalidateProductCache() {
  revalidateTag("products");  // Remove invalid second parameter
}
```

**Effort**: Trivial (5 minutes)

---

### 1.3 Fix Serverless-Incompatible Global State

**Problem**: `recentlySyncedIds` Set uses global state that doesn't persist across serverless invocations.

**File**: `lib/subcription.ts:19-24`

**Solution**:
```typescript
// Option A: Use Redis/Upstash for distributed deduplication
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export async function markAsSynced(id: string): Promise<boolean> {
  const key = `synced:${id}`;
  const result = await redis.set(key, '1', { EX: 10, NX: true });
  return result === 'OK';
}

// Option B: Remove deduplication entirely and rely on idempotent upserts
// Stripe webhooks are already idempotent by event ID
```

**Effort**: Medium (2-4 hours depending on Redis setup)

---

### 1.4 Fix Silent Failures in Sync Operations

**Problem**: Sync functions return `{success: false}` instead of throwing, masking data inconsistencies.

**Files**:
- `lib/product/product-sync.ts:56-59`
- `lib/product/product-sync.ts:89-92`
- `lib/product/product-sync.ts:140-143`
- `lib/product/product-sync.ts:164-167`

**Current**:
```typescript
return { success: false, error };
```

**Fix**:
```typescript
throw new ProductSyncError(
  `Failed to sync product ${product.id}`,
  "SYNC_FAILED",
  { originalError: error, productId: product.id }
);
```

Add new error class:
```typescript
// lib/product/errors.ts
export class ProductSyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProductSyncError';
  }
}
```

**Effort**: Low (1 hour)

---

### 1.5 Add Test Infrastructure

**Problem**: Zero test coverage for the entire product module.

**Solution**: Add Vitest + Playwright testing infrastructure.

**Setup**:

```bash
# Install dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react vite-tsconfig-paths msw
npm install -D @playwright/test
```

**Create test files**:

```typescript
// lib/product/__tests__/crud.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct } from '../crud';

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    products: {
      create: vi.fn().mockResolvedValue({ id: 'prod_123', name: 'Test' }),
    },
    prices: {
      create: vi.fn().mockResolvedValue({ id: 'price_123' }),
    },
  })),
}));

describe('createProduct', () => {
  it('should create product with valid data', async () => {
    const result = await createProduct({
      name: 'Test Product',
      price: 1000,
      currency: 'usd',
    });
    expect(result.id).toBe('prod_123');
  });
});
```

**Effort**: High (1-2 days for setup + initial tests)

---

### 1.6 Fix Race Condition in Price Updates

**Problem**: Gap between new price creation and old price deactivation where both appear active.

**Files**:
- `lib/product/crud.ts:188-192`
- `lib/product/crud.ts:546-550`

**Current**:
```typescript
const newPrice = await stripe.prices.create({...});
await stripe.products.update(id, { default_price: newPrice.id });
await stripe.prices.update(oldPriceId, { active: false });  // Gap here!
```

**Fix**:
```typescript
const newPrice = await stripe.prices.create({...});
// Deactivate old price FIRST
if (product.default_price && product.default_price !== newPrice.id) {
  await stripe.prices.update(product.default_price as string, { active: false });
}
// Then set new default
await stripe.products.update(id, { default_price: newPrice.id });
```

**Effort**: Low (30 minutes)

---

### 1.7 Fix N+1 Query in listProducts

**Problem**: Fetches all products from Stripe, then makes separate Prisma call for nutrition.

**File**: `lib/product/crud.ts:638-683`

**Current**:
```typescript
const products = await stripe.products.list({...});
// Later...
const nutritionData = await prisma.productNutrition.findMany({
  where: { productId: { in: productIds } },
});
```

**Fix**: Already partially optimized, but can be improved:
```typescript
// Parallelize the Stripe and Prisma calls where possible
const [products, allNutrition] = await Promise.all([
  stripe.products.list({ active: true, expand: ["data.default_price"], limit: 100 }),
  prisma.productNutrition.findMany({ where: { productId: { not: { equals: "" } } } }),
]);

// Then filter nutrition by product IDs
const nutritionMap = new Map(allNutrition.map(n => [n.productId, n.nutrition]));
```

**Better Long-term**: Store all product data in database, never call Stripe for reads:
```typescript
export async function listProducts(): Promise<StripeProduct[]> {
  return await listProductsFromDB();  // DB is source of truth
}
```

**Effort**: Medium (2 hours)

---

## Part 2: High Priority Improvements

### 2.1 Add Pagination to All List Queries

**Problem**: Unbounded queries load all data into memory.

**Files**:
- `lib/product/crud.ts:640` - `limit: 100` hardcoded
- `lib/product/crud.ts:709` - Same for coupons
- `lib/product/db-queries.ts:60-76` - No pagination

**Solution**:
```typescript
// lib/product/crud.ts
export async function listProducts(options?: {
  limit?: number;
  cursor?: string;
}): Promise<{ products: StripeProduct[]; nextCursor?: string }> {
  const response = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: options?.limit ?? 50,
    starting_after: options?.cursor,
  });

  return {
    products: response.data.map(transformProduct),
    nextCursor: response.has_more ? response.data[response.data.length - 1]?.id : undefined,
  };
}

// lib/product/db-queries.ts
export const listProductsFromDB = cache(async (
  options?: { limit?: number; cursor?: string }
): Promise<StripeProduct[]> => {
  const products = await prisma.product.findMany({
    where: { active: true },
    take: options?.limit ?? 50,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
    // ...
  });
  return products.map(transformDbProduct);
});
```

**Effort**: Medium (4 hours)

---

### 2.2 Add Transaction Wrapping for Multi-Step Operations

**Problem**: `createPack` and `updatePack` make multiple Stripe calls without atomic rollback.

**Files**:
- `lib/product/crud.ts:381-497` - `createPack`
- `lib/product/crud.ts:499-636` - `updatePack`

**Solution**: Use compensating transactions (saga pattern):

```typescript
export async function createPack(data: PackFormData) {
  let product: Stripe.Product | null = null;
  let prices: Stripe.Price[] = [];

  try {
    product = await stripe.products.create({...});
    
    for (const sizeConfig of data.packSizes || []) {
      if (sizeConfig.enabled) {
        const price = await stripe.prices.create({...});
        prices.push(price);
      }
    }
    
    await stripe.products.update(product.id, {...});
    await syncProductToDatabase(product);
    await revalidateProductCache();
    
    return transformProduct(product);
  } catch (error) {
    // Compensating transactions - rollback
    if (product) {
      try {
        await stripe.products.del(product.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup product:', cleanupError);
      }
    }
    for (const price of prices) {
      try {
        await stripe.prices.update(price.id, { active: false });
      } catch (cleanupError) {
        console.error('Failed to cleanup price:', cleanupError);
      }
    }
    
    throw new ProductCrudError('Failed to create pack', 'PACK_CREATE_FAILED', { originalError: error });
  }
}
```

**Effort**: Medium (3 hours)

---

### 2.3 Add Composite Database Indexes

**Problem**: Category/gender queries use OR but only have separate single-column indexes.

**File**: `prisma/schema.prisma`

**Current**:
```prisma
@@index([category])
@@index([type])
```

**Add**:
```prisma
model Product {
  // ... existing fields
  
  @@index([active])
  @@index([slug])
  @@index([category])
  @@index([type])
  @@index([category, type, active])  // NEW: For category filtering
  @@index([type, active])            // NEW: For bundle queries
  @@map("products")
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_composite_indexes
```

**Effort**: Low (30 minutes + migration)

---

### 2.4 Replace Sequential API Calls with Parallel

**Problem**: `getProductsByPriceIds` makes sequential Stripe API calls.

**File**: `lib/product/crud.ts:725-773`

**Current**:
```typescript
for (const priceId of priceIds) {
  const price = await stripe.prices.retrieve(priceId, {...});
  // ...
}
```

**Fix**:
```typescript
const pricePromises = priceIds.map(id => 
  stripe.prices.retrieve(id.trim(), { expand: ["product"] })
    .catch(err => ({ error: err, id }))
);

const results = await Promise.all(pricePromises);

for (const result of results) {
  if ('error' in result) {
    console.warn(`Failed to fetch price ${result.id}:`, result.error);
    continue;
  }
  // Process successful result
}
```

**Effort**: Low (1 hour)

---

### 2.5 Add Retry Logic for Stripe Calls

**Problem**: No retry for transient failures.

**Solution**: Use Stripe's built-in retry or add custom retry:

```typescript
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  maxNetworkRetries: 3,  // Built-in retry
});

// Or custom retry with exponential backoff:
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}
```

**Effort**: Low (1 hour)

---

### 2.6 Fix Client-Side Filtering to Database-Level

**Problem**: All collection/category pages fetch ALL products then filter in memory.

**Files**:
- `lib/product/cache.ts:47-53` - `getCachedProduct`
- `lib/product/cache.ts:56-73` - `getProductByCategory`
- `lib/product/crud.ts:814-835` - `getProductsByCollection`
- `lib/product/crud.ts:841-885` - `getRelatedProducts`

**Solution**: Add database-level filtering:

```typescript
// lib/product/db-queries.ts
export async function getProductsByCollectionFromDB(
  collectionSlug: string,
  limit?: number
): Promise<StripeProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      metadata: {
        path: ["collection"],
        equals: collectionSlug,
      },
    } as any,  // Prisma JSON filtering
    take: limit ?? 20,
    include: { prices: { where: { active: true } }, nutrition: true },
  });
  
  return products.map(transformDbProduct);
}

// Or better: Add `collection` column to Product model
// prisma/schema.prisma
model Product {
  collection String?
  @@index([collection, active])
}
```

**Effort**: Medium (4 hours)

---

### 2.7 Add Stripe Webhook Signature Verification

**Problem**: Need to verify webhooks are actually from Stripe.

**Solution**:
```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }
  
  // Process event...
}
```

**Effort**: Low (1 hour)

---

### 2.8 Add Error Boundaries and Loading States

**Problem**: No error boundaries at route level, no loading.tsx files.

**Solution**:
```typescript
// app/(root)/product/[slug]/error.tsx
'use client';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}

// app/(root)/product/[slug]/loading.tsx
export default function ProductLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-muted rounded-lg mb-8" />
      <div className="h-8 bg-muted rounded w-1/2 mb-4" />
      <div className="h-4 bg-muted rounded w-1/4" />
    </div>
  );
}
```

**Effort**: Low (2 hours for all routes)

---

## Part 3: Medium Priority Improvements

### 3.1 Improve Type Safety

**Problem**: `eslint-disable @typescript-eslint/no-explicit-any` used throughout.

**Files**:
- `lib/product/crud.ts:1`
- `lib/store/index.ts:1`

**Solution**:
```typescript
// types/product.ts
export interface ProductMetadata {
  slug?: string;
  category?: string;
  type?: 'bundle' | 'simple';
  collection?: string;
  collection_order?: string;
  featured?: 'true' | 'false';
  related_products?: string;
  nutrition?: string;
  [key: string]: string | number | undefined;  // Allow extension
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: ProductMetadata;
  default_price: StripePrice | string | null;
  active: boolean;
}

// Replace any casts with proper types
function stripImage({ image, ...rest }: PackSizeConfig): Omit<PackSizeConfig, 'image'> {
  return rest;
}
```

**Effort**: Medium (4 hours)

---

### 3.2 Add Input Validation for Schema Limits

**Problem**: Schema doesn't validate Stripe-specific limits.

**File**: `lib/product/product.schema.ts`

**Add**:
```typescript
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(250),
  price: z.number()
    .min(0, "Price must be positive")
    .max(9999999, "Price exceeds Stripe maximum"),  // Stripe max
  currency: z.string()
    .min(1, "Currency is required")
    .length(3, "Currency must be 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO code"),
  // ...
});

export const packSchema = z.object({
  // ...
  productIds: z.array(z.string())
    .min(1, "At least one product required")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Product IDs must be unique"
    ),
  // ...
});
```

**Effort**: Low (1 hour)

---

### 3.3 Make USE_DATABASE Environment-Configurable

**Problem**: Hardcoded flag prevents per-environment configuration.

**File**: `lib/product/cache.ts:12`

**Fix**:
```typescript
const USE_DATABASE = process.env.USE_DATABASE_CACHE !== 'false';
// Default to true, allow override via environment variable
```

**Effort**: Trivial (5 minutes)

---

### 3.4 Add Cache Stampede Protection

**Problem**: Multiple simultaneous requests on cache miss all call underlying function.

**Solution**: Single-flight pattern:
```typescript
import { singleflight } from 'singleflight';

const sf = new singleflight.Group();

export const getCachedProducts = unstable_cache(
  async () => {
    return await sf.do('products', async () => {
      // Only one caller executes this
      if (USE_DATABASE) {
        try {
          const products = await listProductsFromDB();
          if (products.length > 0) return products;
        } catch (error) {
          console.warn('Database read failed:', error);
        }
      }
      return await originalListProducts();
    });
  },
  ['stripe-products'],
  { revalidate: 300, tags: ['products'] }
);
```

Or implement manually:
```typescript
let pendingPromise: Promise<StripeProduct[]> | null = null;

export async function getCachedProducts(): Promise<StripeProduct[]> {
  if (pendingPromise) return pendingPromise;
  
  pendingPromise = (async () => {
    try {
      // ... actual fetch logic
    } finally {
      pendingPromise = null;
    }
  })();
  
  return pendingPromise;
}
```

**Effort**: Low (1 hour)

---

### 3.5 Add Rate Limiting to API Endpoints

**Problem**: No protection against abuse.

**Solution**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success, limit, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  // ... actual handler logic
}
```

**Effort**: Medium (2 hours)

---

### 3.6 Add Proper Logging with Context

**Problem**: Console.log/error used throughout, no structured logging.

**Solution**:
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Usage
import { logger } from '@/lib/logger';

logger.error({ err: error, productId: id }, 'Failed to update product');
logger.info({ productId: id, priceId: price.id }, 'Product created');
```

**Effort**: Low (2 hours)

---

### 3.7 Add Database Connection Pooling Configuration

**Problem**: No explicit connection pool settings.

**File**: `lib/prisma.ts`

**Add**:
```typescript
import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection pool settings via DATABASE_URL
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
```

**Effort**: Low (30 minutes)

---

### 3.8 Add Cart Server-Side Persistence

**Problem**: Cart is purely client-side, lost on device switch.

**Solution**:
```typescript
// lib/cart/server-cart.ts
'use server';

import { prisma } from '../prisma';
import { auth } from '../auth';

export async function syncCartToServer(items: CartItem[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return;
  
  await prisma.cart.upsert({
    where: { userId: session.user.id },
    update: { items: items as any, updatedAt: new Date() },
    create: {
      userId: session.user.id,
      items: items as any,
    },
  });
}

export async function getServerCart(): Promise<CartItem[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];
  
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });
  
  return cart?.items as CartItem[] ?? [];
}
```

Add Prisma schema:
```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("cart")
}
```

**Effort**: Medium (4 hours)

---

## Part 4: Testing Strategy

### 4.1 Unit Tests (Vitest)

**Coverage Goals**:
- CRUD operations: 80%
- Cache functions: 70%
- Transform functions: 90%

**Test Files to Create**:
```
lib/product/__tests__/
├── crud.test.ts
├── cache.test.ts
├── db-queries.test.ts
├── product-sync.test.ts
├── pack-transformer.test.ts
└── errors.test.ts
```

**Example Test**:
```typescript
// lib/product/__tests__/crud.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProduct, updateProduct, archiveProduct } from '../crud';

// Mock Stripe
vi.mock('stripe', () => {
  const mockProduct = { id: 'prod_test', name: 'Test Product' };
  const mockPrice = { id: 'price_test', unit_amount: 1000 };
  
  return {
    default: vi.fn(() => ({
      products: {
        create: vi.fn().mockResolvedValue(mockProduct),
        update: vi.fn().mockResolvedValue(mockProduct),
      },
      prices: {
        create: vi.fn().mockResolvedValue(mockPrice),
        update: vi.fn().mockResolvedValue(mockPrice),
      },
    })),
  };
});

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    productNutrition: {
      upsert: vi.fn().mockResolvedValue({ productId: 'prod_test', nutrition: '' }),
    },
  },
}));

describe('createProduct', () => {
  it('creates product with valid data', async () => {
    const result = await createProduct({
      name: 'Test Product',
      price: 1000,
      currency: 'usd',
    });
    
    expect(result.id).toBe('prod_test');
  });
  
  it('throws ProductCrudError on invalid metadata', async () => {
    await expect(createProduct({
      name: 'Test',
      price: -100,
      currency: 'usd',
    })).rejects.toThrow('Price must be positive');
  });
});
```

**Effort**: High (2-3 days)

---

### 4.2 Integration Tests

**Coverage Goals**:
- Database operations: 70%
- Stripe webhook handlers: 80%

**Setup**:
```typescript
// __tests__/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  execSync('npx prisma migrate deploy');
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up between tests
  await prisma.product.deleteMany();
});
```

**Effort**: High (2 days)

---

### 4.3 E2E Tests (Playwright)

**Coverage Goals**:
- Checkout flow: 100%
- Admin product management: 80%

**Test Files to Create**:
```
e2e/
├── auth.spec.ts
├── checkout.spec.ts
├── product.spec.ts
├── admin/
│   ├── product-management.spec.ts
│   └── order-management.spec.ts
```

**Example Test**:
```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete checkout', async ({ page }) => {
  await page.goto('/product/test-product');
  
  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  
  // Go to cart
  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');
  
  // Stripe checkout (cross-origin)
  await page.waitForURL(/checkout\.stripe\.com/);
  await page.fill('[name="email"]', 'test@example.com');
  // ... complete Stripe test checkout
});
```

**Effort**: High (2-3 days)

---

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] Fix memory leaks (add LRU cache or remove)
- [ ] Fix cache revalidation bug
- [ ] Fix serverless-incompatible global state
- [ ] Fix silent failures in sync
- [ ] Fix race condition in price updates

### Week 2: High Priority
- [ ] Add test infrastructure (Vitest + Playwright)
- [ ] Add pagination to list queries
- [ ] Add transaction wrapping
- [ ] Add composite database indexes
- [ ] Fix N+1 queries

### Week 3: Performance & Resilience
- [ ] Replace sequential API calls with parallel
- [ ] Add retry logic
- [ ] Add webhook signature verification
- [ ] Fix client-side filtering
- [ ] Add error boundaries

### Week 4: Polish & Monitoring
- [ ] Improve type safety
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Add structured logging
- [ ] Add cart server-side persistence

---

## Monitoring & Observability

### Add Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripeConnection(),
    cache: await checkCacheConnection(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  return NextResponse.json(checks, { 
    status: allHealthy ? 200 : 503 
  });
}
```

### Add Metrics

```typescript
// lib/metrics.ts
import { Metrics } from '@effectively/metrics';

export const metrics = new Metrics({
  prefix: 'store_',
});

// Track in CRUD operations
metrics.increment('product.created');
metrics.histogram('product.list.duration', duration);
metrics.gauge('product.cache.size', cacheSize);
```

---

## Success Criteria

### Performance Targets
- [ ] Product list page: < 200ms TTFB
- [ ] Product detail page: < 150ms TTFB
- [ ] API endpoints: < 100ms response time
- [ ] Stripe sync: < 5s for 100 products

### Reliability Targets
- [ ] Zero data loss on sync failures
- [ ] Graceful degradation when Stripe is down
- [ ] No memory leaks after 24h load test
- [ ] 100% webhook signature verification

### Quality Targets
- [ ] 80% unit test coverage
- [ ] 70% integration test coverage
- [ ] 100% E2E coverage for checkout
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
