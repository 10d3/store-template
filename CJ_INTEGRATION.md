# CJ Dropshipping Integration

Status: **Phases 0–6 complete** — full CJ lifecycle wired (see `CJ_INTEGRATION_PLAN.md` for the roadmap).

- **Phase 0:** typed, rate-limited client for the [CJ Dropshipping API v2](https://developers.cjdropshipping.cn/en/api/api2/).
- **Phase 1:** schema for the DB-as-catalog model (variants, fulfillments, CJ token store) and a
  DB-backed token cache.
- **Phase 2:** admin can search the CJ catalog and import products — creates a Stripe product +
  one Stripe Price per variant, and upserts `Product` (source=CJ) / `Price` / `ProductVariant` rows.
- **Phase 3:** CJ products render on the storefront with a real variant selector + per-variant
  stock; checkout enforces stock server-side. Manual products are untouched (coexistence).
- **Phase 4:** when a CJ item is paid for, a fulfillment order is created in CJ automatically
  (background Inngest job), recorded as a `Fulfillment` row.
- **Phase 5:** an hourly job polls CJ for status + tracking and emails the customer when tracking
  appears; the manual admin tracking email now shares the same sender.
- **Phase 6:** a 6-hourly job refreshes CJ variant stock so the storefront + checkout guard stay
  accurate.

## Phase 1 schema changes (`prisma/schema.prisma`)

| Model | Change |
|---|---|
| `Product` | `+ source` (MANUAL\|CJ), `+ cjProductId`, `+ trackInventory`, `+ variants[]`, indexes on `source`/`cjProductId` |
| `ProductVariant` (new) | real variants + inventory: `options Json`, `stock`, `cost`, `cjVariantId`, `cjSku`, `stripePriceId` (unique) |
| `Fulfillment` (new) | links `Order` → supplier order: `provider`, `cjOrderId`, `status`, `trackingNumber/Url`, `carrier`, `raw` |
| `CjAuth` (new) | single-row CJ token store (`accessToken`, `refreshToken`, expiries) |
| `Order` | `+ fulfillments[]` |

### Apply the migration (touches your DB — run when ready)

```bash
npx prisma migrate dev --name cj_catalog          # applies ALL pending schema changes (Phase 1 + promoted columns)
bun prisma/scripts/backfill-variants.ts           # one ProductVariant per existing Price (idempotent)
bun prisma/scripts/backfill-product-columns.ts    # fill featured/collection/collectionOrder/tags from metadata
```

The CJ client degrades gracefully: until `CjAuth` exists, it uses the in-memory token cache only,
so the app keeps working pre-migration.

## Phase 2 — product import

- **Server actions** (`lib/cj/import.ts`): `searchCjCatalog`, `getCjProductPreview`, `importCjProduct(pid, { markup, manualPrices, trackInventory, syncStock })`.
- **Admin UI**: `/admin/product/cj` (sidebar → "CJ Import") — search the catalog, set a markup
  (×supplier cost), and import with one click.
- Import creates a **Stripe product mirror + one Stripe Price per variant**, then upserts
  `Product` (`source="CJ"`, `cjProductId`, `trackInventory=true`), `Price`, and `ProductVariant`
  rows. Re-importing the same `pid` is blocked (`ALREADY_IMPORTED`).
- Selling price = supplier cost × `markup` (default 3), or per-variant `manualPrices` (cents).
- Initial stock is fetched best-effort per variant (slow — CJ is 1 req/sec); the Phase 6 cron
  keeps it fresh.
- **Requires the Phase 1 migration applied** (uses `Product.cjProductId` + `ProductVariant`).
- CJ image CDNs (`*.cjdropshipping.com`, `*.alicdn.com`, `*.aliyuncs.com`) added to
  `next.config.ts` `images.remotePatterns`.

## Phase 3 — storefront variants + inventory

- **Data layer**: `transformDbProduct` (`lib/utils.ts`) now surfaces `source`, `trackInventory`,
  and `productVariants[]` (real variants joined to their Price); `listProductsFromDB` /
  `getProductBySlugFromDB` (`lib/product/db-queries.ts`) include active variants.
- **Variant UI**: `components/shared/variant-purchase-panel.tsx` — variant selector + stock-capped
  quantity + Add/Buy wired to the variant's real `stripePriceId` (required for CJ auto-fulfillment).
  The product page (`app/(root)/product/[slug]/page.tsx`) renders it **only when `source === "CJ"`**;
  manual (slug-grouped) products keep their existing UI unchanged.
- **Inventory enforcement**: `lib/cart/validate-stock.ts` (`assertStockAvailable`) runs in all four
  checkout functions in `lib/cart/checkout-session.ts`. It blocks overselling for variants whose
  product has `trackInventory=true`, and **degrades gracefully** (skips) if the table is missing
  pre-migration. Add-to-cart/buy-now also cap quantity at `variant.stock` client-side.

### Deferred (intentionally)
- **Admin variant editor** for *manual* products (slug-grouping still in use there). CJ products
  don't need it — they're imported, not hand-edited. Promoting `featured`/`collection`/`tags` to
  indexed columns (the JSON→column discussion) is also deferred until needed.
- Requires the Phase 1 migration to actually enforce stock / render CJ variants.

## Phase 4 — auto order placement

- The `checkout.session.completed` webhook (`lib/subcription.ts`) fires an Inngest event
  `cj/order.fulfill` after saving the order (fire-and-forget; keeps the webhook fast).
- `fulfillCjOrder` (`lib/inngest/functions.ts`, registered in `app/api/inngest/route.ts`):
  1. loads the order; **skips if already fulfilled** (idempotent);
  2. resolves CJ line items from the **Stripe session line items** → `ProductVariant.cjVariantId`
     (the manual line-item JSON doesn't carry the price id, so we read the real session items);
  3. picks the cheapest shipping via `freightCalculate` (fallback `CJPacket Ordinary`);
  4. calls `createCjOrder` and writes a `Fulfillment` row with `cjOrderId`.
- **Retries/idempotency**: Inngest `retries: 4` + step memoization means the CJ order is created
  exactly once even if later steps fail; cross-delivery is guarded by the existing-Fulfillment check.
- **Not yet done**: paying/confirming the CJ order (needs CJ wallet balance) — the order is left in
  CJ's `CREATED` state. Orders with no shipping address are recorded as `NEEDS_ADDRESS`.
- Env (optional): `CJ_FROM_COUNTRY_CODE` (origin country, default `CN`).

## Phase 5 — tracking sync

- **Shared sender**: `lib/order/send-tracking.ts`
  - `sendTrackingEmail(params)` — low-level (build + send the shipped email).
  - `sendTrackingUpdate({ orderId, trackingNumber, trackingUrl?, carrier? })` — loads the DB order
    and emails the customer.
- The manual admin route (`app/api/orders/[id]/tracking/route.ts`) now calls `sendTrackingEmail`
  (its existing PI-based data gathering is unchanged).
- **`cjTrackingSync`** (`lib/inngest/functions.ts`, cron `0 * * * *`): polls up to 50 open CJ
  `Fulfillment`s via `getCjOrderDetail`, updates `status` / `trackingNumber` / `carrier` /
  `trackingUrl` (a 17track link), and on the **no-tracking → tracking** transition calls
  `sendTrackingUpdate`. Idempotent: the persisted tracking number prevents re-emailing.
- CJ has no dedicated tracking webhook; an optional `app/api/webhooks/cj/route.ts` push receiver
  could speed updates, but the hourly cron is the reliable path (left out for now).

## Phase 6 — inventory sync

- **`cjInventorySync`** (`lib/inngest/functions.ts`, cron `0 */6 * * *`): refreshes up to 200
  CJ-linked `ProductVariant`s via `getCjVariantStock`, updates `stock`, and revalidates the product
  cache when anything changed.
- **Stock-only by design** — it does *not* flip `active`. Deactivating the last active variant
  would empty `productVariants`, dropping a CJ product back to the legacy add-to-cart path (no
  `stripePriceId` → the stock guard is skipped → oversell). Keeping variants active means `stock=0`
  renders as "Out of stock" and is still enforced at checkout; admins control visibility.

## Inngest jobs summary

| Function | Trigger | Purpose |
|---|---|---|
| `fulfillCjOrder` | event `cj/order.fulfill` | create CJ order on payment |
| `cjTrackingSync` | cron `0 * * * *` | pull tracking, email customer |
| `cjInventorySync` | cron `0 */6 * * *` | refresh variant stock |

All registered in `app/api/inngest/route.ts`.

## Follow-ups (built)

- **CJ auto pay/confirm**: `fulfillCjOrder` now calls `confirmCjOrder` after creating the order
  (pays from CJ wallet). Insufficient balance is caught — the order stays `CREATED` and the
  `Fulfillment` records the error in `raw`; status becomes `CONFIRMED` on success.
- **JSON → columns**: `Product` gains indexed `collection`, `collectionOrder`, `featured`, `tags`.
  `syncProductToDatabase` populates them; `getFeaturedProducts` / `getProductsByCollection` /
  `getCollections` now run as DB queries (`lib/product/db-queries.ts`) instead of loading all
  products and filtering in JS. Backfill: `prisma/scripts/backfill-product-columns.ts`.
- **Manual variant editor**: `lib/product/variants.ts` (`list/create/update/deleteProductVariant`,
  `setProductTrackInventory`) + `ManageVariantsDialog` (admin Product list → "Variants" / layers
  icon). Each variant = a Stripe Price + `ProductVariant` row. The storefront variant panel now
  renders for **CJ products OR manual products with `trackInventory` enabled** (toggle in the
  dialog), so hand-built variants show a real selector + stock.

## Admin — Fulfillments view

- `/admin/fulfillment` (sidebar → "Fulfillments", `Truck` icon): read-only table of CJ
  `Fulfillment` rows joined to their order — order #, customer, provider, status badge, CJ order id,
  tracking link, created date. Shows `NEEDS_ADDRESS` cases that need attention.
- It's a **separate view** (not the existing order table) because the admin order list is Stripe
  Payment-Intent–based (`pi_…`) while fulfillments key off DB orders (`cs_…`) — there's no reliable
  join key between them.

## Environment variables

Add to your `.env`:

```env
# CJ Dropshipping
CJ_API_KEY="CJUserNum@api@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# Optional — defaults to the production base URL
CJ_API_BASE="https://developers.cjdropshipping.com/api2.0/v1"
```

Get your `CJ_API_KEY` from the CJ dashboard: **Account → API → API Key** (format `CJUserNum@api@<key>`).

## Module layout (`lib/cj/`)

| File | Purpose |
|---|---|
| `client.ts` | Auth token lifecycle (get/refresh + cache), 1 req/sec throttle, envelope unwrap, `CjApiError` on failure. Exposes `cj.get/post/patch/delete`. |
| `products.ts` | `queryCjProducts`, `getCjProduct`, `getCjVariants` |
| `inventory.ts` | `getCjVariantStock` |
| `orders.ts` | `createCjOrder`, `getCjOrderDetail`, `confirmCjOrder`, `deleteCjOrder` |
| `logistics.ts` | `freightCalculate` (shipping estimate) |
| `types.ts` | Envelope + request/response types |
| `errors.ts` | `CjApiError` |
| `index.ts` | Barrel export |

### Notes
- **Rate limit:** CJ enforces 1 request/second globally. `client.ts` serializes all calls through a throttle, so callers don't need to add delays. For bulk work, lean on Inngest retries (Phases 4–6).
- **Auth:** uses `apiKey` → access token (15-day TTL) + refresh token (180-day TTL); CJ caches the same token for 24h per account. The auth header on requests is `CJ-Access-Token`.
- **Token storage:** currently in-memory. **Phase 1** introduces a `CjAuth` table; swap `tokenStore` in `client.ts` for DB persistence then.

## Verify connectivity

```bash
bun prisma/scripts/cj-test.ts          # default keyword "mug"
bun prisma/scripts/cj-test.ts hoodie   # custom search keyword
```

Expected: prints "Auth OK", a few products from `listV2`, and one product's variants.
