# Vitanou store

A standard Next.js ecommerce store: catalog, product variants, cart, Stripe Checkout, orders, customer accounts, and an admin panel.

## Stack

- Next.js 16 (App Router, React 19)
- Prisma + PostgreSQL
- Better Auth (email/password, Google, admin role)
- Stripe Checkout + webhooks
- Resend email
- UploadThing image uploads
- Tailwind CSS 4 + shadcn/Radix
- Zustand cart (persisted in localStorage)

## Local setup

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL, BETTER_AUTH_SECRET, and Stripe/Resend/UploadThing keys
pnpm exec prisma migrate dev
pnpm seed
pnpm dev
```

Open http://localhost:3000.

The seed creates an admin account:

- Email: `admin@vitanou.com`
- Password: `admin12345`

Change that password before deploying.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Generate Prisma Client and build |
| `pnpm start` | Start the production build |
| `pnpm lint` | Run ESLint |
| `pnpm seed` | Seed categories, collections, products, variants, and the admin user |

## Stripe

Point a Stripe webhook at:

```
POST /api/webhooks/stripe
```

Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use Stripe test keys while developing. Checkout is disabled without a secret key.

## Database

The app uses a fresh schema. To reset locally:

```bash
pnpm exec prisma migrate reset
pnpm seed
```

Back up any database you care about before resetting it.

## Project structure

- `app/(store)/` — storefront, cart, checkout success, auth, account, static pages
- `app/admin/` — admin dashboard, products, categories, collections, orders, customers
- `app/api/webhooks/stripe/` — payment webhook
- `lib/catalog/` — catalog queries
- `lib/cart/` — client cart store
- `lib/admin/` — admin server actions
- `prisma/schema.prisma` — database schema
- `prisma/seed.mjs` — seed data
