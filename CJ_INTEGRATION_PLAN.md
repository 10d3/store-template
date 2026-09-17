# Plan: DB-as-Catalog Refactor + CJ Dropshipping Integration

## Context

Today **Stripe is the product catalog source of truth**. Admin CRUD (`lib/product/crud.ts`)
writes products/prices to Stripe first, then mirrors them into Postgres (`lib/product/product-sync.ts`),
triggered by both CRUD calls and Stripe webhooks routed through `@better-auth/stripe`'s
`onEvent` → `lib/subcription.ts`. Storefront mostly reads the DB mirror via
`getCachedProducts` (`lib/product/cache.ts`), but admin and some paths still hit Stripe
directly through `listProducts()`/`getProduct()`.

This causes the four confirmed pain points: **variants are faked** (slug-grouping +
multiple prices), **no real inventory** (`maxQuantity` lives only in the Zustand cart,
`lib/store/index.ts`), **metadata hacks** (Stripe's 500-char limit forces nutrition into a
side table and `pack_sizes` into a crammed JSON string), and **slow/Stripe-coupled reads**.

We also want to add **CJ Dropshipping** as a product source + fulfillment provider, with the
full lifecycle automated: product import/sync, auto order placement on payment, auto tracking
sync, and inventory/stock sync.

**Decisions locked in:** flip to DB-as-catalog (Stripe demoted to payment-only); create a real
Stripe Price per CJ product; a single unified `Product` model with a `source` discriminator so
manual and CJ products coexist; all four CJ automations in scope.

**Intended outcome:** Postgres is the canonical catalog with real variants + inventory; Stripe
is purely the payment processor; CJ products flow in as a new source and fulfill automatically;
the existing manual product/checkout/order flow keeps working unchanged.

---

## Guiding principle: coexistence via a `source` discriminator

One `Product` model, `source = MANUAL | CJ`. `Product.id` stays the Stripe product ID for **both**
sources (we always create a Stripe product mirror so checkout `stripePriceId` line items keep
working and existing relations — `ProductNutrition.productId`, `Price.productId` — are untouched).
Fulfillment branches on `source`: MANUAL = current manual tracking-email flow; CJ = automated.

---

## Build status

All phases implemented (see `CJ_INTEGRATION.md` for usage). Migration intentionally not yet applied.

- [x] **Phase 0 — CJ API client** (`lib/cj/`: client, products, inventory, orders, logistics, types, errors; `cj-test.ts`)
  - [x] Auth lifecycle (getAccessToken/refresh) + token cache
  - [x] 1 req/sec throttle + envelope unwrap + `CjApiError`
- [x] **Phase 1 — schema** (`Product.source/cjProductId/trackInventory`, `ProductVariant`, `Fulfillment`, `CjAuth`, `Order.fulfillments`)
  - [x] DB-backed token store (graceful degrade pre-migration)
  - [x] `backfill-variants.ts` (incl. color/size/sku/pack_size → options)
- [x] **Phase 2 — product import** (`importCjProduct`, `searchCjCatalog`, `getCjProductPreview`; admin `/admin/product/cj`; image CDNs)
  - [x] Stripe product + price-per-variant; `markAsSynced` dedupe; `ALREADY_IMPORTED` guard
- [x] **Phase 3 — storefront variants + inventory**
  - [x] Surface `source`/`trackInventory`/`productVariants` (`transformDbProduct`, `db-queries`)
  - [x] `VariantPurchasePanel` (CJ-only, carries real `stripePriceId`)
  - [x] Server-side stock guard `assertStockAvailable` in all checkout fns
  - [x] Admin variant editor for *manual* products (`lib/product/variants.ts`, `ManageVariantsDialog`; storefront panel opt-in via `trackInventory`)
  - [x] Promote `featured`/`collection`/`collectionOrder`/`tags` JSON→columns (+ indexed); reads rewritten as DB queries; `backfill-product-columns.ts`
- [x] **Phase 4 — auto order placement** (`fulfillCjOrder` on `checkout.session.completed`)
  - [x] Resolve CJ items via Stripe session line items → `cjVariantId`; freight pick; idempotent
  - [x] Auto pay/confirm CJ order (`confirmCjOrder`) — graceful on insufficient wallet balance
- [x] **Phase 5 — tracking sync** (`cjTrackingSync` hourly; shared `lib/order/send-tracking.ts`)
  - [x] Admin tracking route refactored onto shared sender
  - [ ] Optional CJ status webhook receiver — **deferred** (cron is reliable path)
- [x] **Phase 6 — inventory sync** (`cjInventorySync` 6-hourly)
  - [~] Stock-only (no `active` flip) — **intentional deviation** to avoid the empty-variants oversell fallback
- [x] **Follow-up — admin Fulfillments view** (`/admin/fulfillment`, read-only CJ status/tracking)

---

## Phase 0 — CJ API client (no UI, verify connectivity first) ✅

New module `lib/cj/`:
- `client.ts` — fetch wrapper around CJ API v2 (`CJ_API_BASE`, default
  `https://developers.cjdropshipping.com/api2.0/v1`). Handles auth token lifecycle
  (`authentication/getAccessToken` → access token ~15-day TTL + refresh token), token caching
  (a `CjAuth` settings row in DB, see Phase 1), and the **1 req/sec rate limit** (simple queue/throttle).
- `products.ts` — `getCjProduct(pid)`, `queryCjProducts(filter)`, variant fetch.
- `orders.ts` — `createCjOrder(payload)`, `getCjOrderDetail(cjOrderId)`.
- `logistics.ts` — `freightCalculate(...)` (shipping estimate, optional this phase).
- `inventory.ts` — variant stock lookup.
- `types.ts`, `errors.ts` (mirror the `ProductCrudError` style in `lib/product/errors.ts`).

Env: add `CJ_EMAIL`, `CJ_API_KEY`, `CJ_API_BASE` (document in `STRIPE_INTEGRATION.md` or a new
`CJ_INTEGRATION.md`). **During implementation, WebFetch the current CJ API v2 docs** to confirm
exact endpoint paths/field names (they vary by version).

## Phase 1 — Schema migration (`prisma/schema.prisma`) ✅

Promote Postgres to canonical catalog:

- **`Product`**: add `source String @default("MANUAL")`, `cjProductId String?` (`@@index`),
  `trackInventory Boolean @default(false)`. Keep `id` = Stripe product id.
- **New `ProductVariant`** — real variants + inventory:
  `id`, `productId`→Product, `stripePriceId String? @unique`, `sku`, `options Json`
  (`{color,size,...}`), `cjVariantId String?`, `cjSku String?`, `cost Int?` (supplier cents),
  `stock Int @default(0)`, `image String?`, `active Boolean`. Indexes on `productId`, `cjVariantId`.
- **New `Fulfillment`** — Order↔supplier link (supports multiple shipments):
  `id`, `orderId`→Order, `provider String` (CJ|MANUAL), `cjOrderId String?`, `cjOrderNum String?`,
  `status String`, `trackingNumber/trackingUrl/carrier String?`, `raw Json?`, timestamps.
  Add `fulfillments Fulfillment[]` to `Order`.
- **New `CjAuth`** (single-row token store): `accessToken`, `refreshToken`, `accessExpiresAt`, `refreshExpiresAt`.
- Keep `Price`; new variants link to a Price via `stripePriceId`.

Backfill script in `prisma/scripts/` (pattern from `resync-stripe-products.ts`): for existing
slug-grouped products, create one `ProductVariant` per current Price so the new variant model is
populated without data loss.

## Phase 2 — CJ product import (admin) + Stripe price-per-variant ✅

- `lib/cj/import.ts` → `importCjProduct(cjPid, { markup | manualPrices })`:
  1. Fetch CJ product + variants (`lib/cj/products.ts`).
  2. Create Stripe product + **one Stripe Price per variant** (chosen pricing model).
  3. Upsert `Product` (`source="CJ"`, `cjProductId`), `ProductVariant` rows (`cjVariantId`, `cost`,
     `stock`, `stripePriceId`), and `Price` rows — **reuse** `syncProductToDatabase` /
     `syncPriceToDatabase` and call `markAsSynced(id)` (from `lib/subcription.ts`) to suppress the
     redundant webhook re-sync.
  4. Selling price = `cost * markup` (or manual). Revalidate via `revalidateProductCache()`.
- Admin UI: new "CJ Import" tab/page under `app/admin/product/` mirroring
  `app/admin/product/_components/product-management-page.tsx` — search CJ catalog, preview,
  set markup, import.

## Phase 3 — DB-as-catalog reads + real variants + inventory enforcement ✅

- **Repoint reads off Stripe**: audit consumers of `listProducts()` / `getProduct()` /
  `getProductsByPriceIds()` in `lib/product/crud.ts` and switch storefront/admin reads to the DB
  layer in `lib/product/db-queries.ts` (`listProductsFromDB`, `getProductBySlugFromDB`,
  `getProductsByIdsFromDB`). `getCachedProducts` is already DB-first — extend its
  `transformDbProduct` (`lib/utils`) to surface `variants` + per-variant `stock`.
- **Real variant UI**: product page (`app/(root)/product/[slug]`) and admin product form
  (`app/admin/_components/form/product-form.tsx`) read/write `ProductVariant` instead of
  slug-grouping. Cart `CartItem` (`lib/store/index.ts`) already carries `variantId`/`stripePriceId`.
- **Inventory enforcement**: derive cart `maxQuantity` from `variant.stock`; disable buy/add when
  0; **enforce server-side** in `lib/cart/checkout-session.ts` (validate stock before creating the
  Stripe session) so stock can't be bypassed.
- **Metadata cleanup**: store variant `options` as structured JSON (not Stripe metadata); keep
  Stripe metadata to IDs only; move `pack_sizes` toward variant rows over time.

## Phase 4 — Auto order placement on payment (Inngest) ✅

- In `handleCheckoutCompletedSession` (`lib/subcription.ts`), after the existing `order.upsert`,
  resolve each line item's product via `stripePriceId → Price → ProductVariant → cjVariantId`
  (DB lookup, robust against loose line-item JSON). If any line is `source="CJ"`, **send an Inngest
  event** `cj/order.fulfill` with `{ orderId, shippingAddress, items:[{cjVariantId, qty}] }`.
  Keep the webhook fast/resilient — the CJ call happens in the background function.
- New Inngest function in `lib/inngest/functions.ts` (pattern from `processPayout`): on
  `cj/order.fulfill`, call `createCjOrder`, create/update a `Fulfillment` row with `cjOrderId`,
  with Inngest retries handling CJ rate limits/failures.

## Phase 5 — Auto tracking sync ✅

- Refactor the tracking-email logic out of `app/api/orders/[id]/tracking/route.ts` into a reusable
  `lib/order/send-tracking.ts` (`sendTrackingUpdate({...})`) so both the manual admin POST and the
  automated sync share one code path (reuses `TrackingEmail` + `sendEmail`).
- New Inngest cron function `cjTrackingSync` (pattern from `payoutBatchJob`): poll CJ for
  `Fulfillment`s not yet delivered → on new tracking, update the row and call `sendTrackingUpdate`.
- Optional: `app/api/webhooks/cj/route.ts` to receive CJ status callbacks for faster updates; the
  cron remains the reliable fallback.

## Phase 6 — Inventory/stock cron sync ✅

- Inngest cron `cjInventorySync` (pattern from `payoutBatchJob`): iterate `ProductVariant` where
  `cjVariantId != null`, fetch CJ stock, update `stock`, deactivate variant when 0, then
  `revalidateProductCache()`.

---

## Critical files

| File | Change |
|---|---|
| `prisma/schema.prisma` | `ProductVariant`, `Fulfillment`, `CjAuth`; `Product.source/cjProductId/trackInventory`; `Order.fulfillments` |
| `lib/cj/*` (new) | CJ API client, import, orders, inventory, logistics, types, errors |
| `lib/subcription.ts` | dispatch `cj/order.fulfill` after order upsert; reuse `markAsSynced` in import |
| `lib/inngest/functions.ts` | `cj/order.fulfill`, `cjTrackingSync` (cron), `cjInventorySync` (cron) |
| `lib/cart/checkout-session.ts` | server-side stock validation before Stripe session |
| `lib/product/crud.ts` + consumers | repoint reads to `lib/product/db-queries.ts` |
| `lib/product/db-queries.ts`, `lib/utils` (`transformDbProduct`) | surface variants + stock |
| `app/api/orders/[id]/tracking/route.ts` → `lib/order/send-tracking.ts` (new) | extract reusable tracking sender |
| `app/admin/product/_components/*`, `app/admin/_components/form/product-form.tsx` | CJ import UI + variant editor |
| `app/(root)/product/[slug]` | variant selection + stock UI |
| `prisma/scripts/` (new) | backfill variants from existing prices |

## Verification (end-to-end, test/sandbox mode)

1. **CJ client**: run a small script calling `getAccessToken` + `getCjProduct` against CJ; print result.
2. **Schema**: `prisma migrate dev`; run backfill; confirm `ProductVariant` rows for existing products.
3. **Import**: import a CJ pid; confirm `Product`(source=CJ) + `ProductVariant` + `Price` rows and a Stripe product/prices exist.
4. **Reads/inventory**: storefront shows the CJ product with variants; set a variant `stock=0` and confirm buy is disabled and `createCheckoutSession` rejects it.
5. **Checkout → order**: complete a Stripe **test** checkout for a CJ item; confirm `Order` created via existing webhook.
6. **Auto fulfillment**: run Inngest dev server (`/api/inngest`); confirm `cj/order.fulfill` runs and a `Fulfillment` row gets a `cjOrderId` (CJ sandbox).
7. **Tracking**: simulate CJ tracking (or run `cjTrackingSync`); confirm `Fulfillment` updates and the customer tracking email sends; confirm the manual admin tracking POST still works.
8. **Inventory cron**: run `cjInventorySync` locally; confirm `stock` updates and out-of-stock disables buy.

## Notes / risks
- Manual product + checkout + order flow stays unchanged (regression-test it).
- CJ rate limit (1 req/sec) → throttle in `lib/cj/client.ts`; lean on Inngest retries for bulk ops.
- Confirm exact CJ v2 endpoint paths/fields via WebFetch during implementation.
- Phases are independently shippable; recommend landing 0–1 (client + schema) first behind no UI.
