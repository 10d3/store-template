# 🧠 AI Development Rules for E-Commerce Template

This document defines the rules the AI must follow when building or modifying the e-commerce template.

---

## ✅ 1. General Architecture

- **Modular Structure**  
  All components, utilities, and logic must be modular and easily replaceable.

- **No Store-Specific Data in Code**  
  All labels, descriptions, currency, and product strings must come from locale message files.

- **No Hardcoded Branding**  
  Colors, logos, and fonts are defined via `theme.config.ts`.

- **Stripe Config Must Be Swappable**  
  Stripe keys and webhook secrets must come from `.env`.

- **Hybrid Rendering**  
  Prefer static generation (SSG). Use SSR only where required (e.g., Stripe price fetch).

---

## 🌐 2. Internationalization (i18n)

- **No Locale in URL Path**  
  The URL should be clean (e.g., `/product/shirt`), with the locale detected via browser or config.

- **Use Message Files for All Text**  
  All user-facing text must be accessed using `t('key')`. Example: `t('cart.checkoutButton')`

- **Flat Message Structure Preferred**  
  Group by feature (`cart`, `product`, `checkout`), but avoid deep nesting for easy editing.

- **SEO Metadata from i18n**  
  Page titles, descriptions, and OG tags must be generated from the message files.

---

## 💳 3. Stripe Integration

- **No Hardcoded Product Info**  
  Product name, price, and description come from Stripe or webhook-synced data.

- **Stripe Checkout Flow**  
  Use Stripe Checkout Sessions based on `price_id`.

- **Stripe Config from .env**  
  Use `.env` for keys:

  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLIC_KEY`
  - `STRIPE_WEBHOOK_SECRET`

- **Support for Stripe Metadata**  
  Allow usage of `product.metadata` (e.g. for localized slugs or tags).

---

## 💅 4. UI / UX Standards

- **shadcn/ui Components Only**  
  All buttons, forms, modals, etc., must use shadcn/ui components.

- **TailwindCSS for All Styling**  
  Use Tailwind exclusively. Theme customization is handled via Tailwind config.

- **Responsive by Default**  
  Layouts must adapt to mobile, tablet, and desktop without additional configuration.

- **Dark Mode Support**  
  Implement using `next-themes`. Light mode is default.

- **Global Layout in `/components/layout`**  
  Shared components like Header, Footer, and Nav must live in the layout folder and be customizable.

---

## ⚙️ 5. Developer Experience

- **No CLI Bootstrapping**  
  The template should be customizable by editing the following files manually:

  - `.env`
  - `/messages/*`
  - `theme.config.ts`

- **No Hardcoded Strings**  
  Even secondary pages (`about`, `faq`, `checkout`) must only use `t()` for content.

- **Dummy Fallback Data**  
  Provide `products.dummy.ts` for fallback when Stripe is not configured.

- **Layout Variants Supported**  
  Allow pages to choose between different layouts (`DefaultLayout`, `MinimalLayout`, etc.).

---

## 🔁 6. Optional: Content Management

- **CMS or Markdown Optional**  
  Support MDX or Markdown for content-driven pages like FAQs or blog.

---

# Storefront Metadata Cheat-Sheet  
*(copy-paste keys exactly as shown)*

---

## 1. Product-level (`Product.metadata`)
| Key                | Example value              | Purpose / UI label                                |
|--------------------|----------------------------|---------------------------------------------------|
| `category`         | `"coffee"`                 | Navigation & filters                              |
| `tags`             | `"organic,fair-trade"`     | Search / marketing tags (comma-separated)         |
| `seo_title`        | `"Colombia Coffee 250 g"`  | `<title>` override                                |
| `seo_description`  | `"Single-origin beans..."` | `<meta name="description">`                       |
| `pack_size`        | `3`                        | Number of units inside this SKU                   |
| `bundle_type`      | `"fixed"` or `"build_your_own"` | Shows picker or not                            |
| `contents`         | `"price_1abc,price_2def"`  | Price IDs inside a virtual bundle (comma list)    |
| `variant_group`    | `"color"` or `"size"`      | Filters variants for swatches                     |
| `weight_grams`     | `250`                      | Shipping calculator                               |
| `digital`          | `"true"`                   | Skips shipping / inventory                        |
| `subscription_only`| `"true"`                   | Hide from one-time cart                           |
| `gift_card`        | `"true"`                   | Skip inventory checks                             |

---

## 2. Price-level (`Price.metadata`)
| Key                   | Example value | Purpose / UI label                     |
|-----------------------|---------------|----------------------------------------|
| `discount_group`      | `"coffee"`    | Coupon targeting group                 |
| `tier`                | `3`           | Quantity-tier trigger (3, 6, etc.)     |
| `discount_percent`    | `15`          | Auto-apply 15 % when tier reached      |
| `max_per_customer`    | `5`           | Purchase limit                         |
| `sku`                 | `"COF-001"`   | Internal barcode / ERP code            |
| `color`, `size`, etc. | `"black"`     | Variant descriptors                    |

---

## 3. Coupon-level (`Coupon.metadata`)
| Key                    | Example value       | Purpose / UI label                         |
|------------------------|---------------------|--------------------------------------------|
| `campaign`             | `"SUMMER25"`        | Attribution / analytics tag                |
| `tier_qty`             | `3`                 | Minimum quantity for discount to trigger   |
| `tier_type`            | `"percent"` or `"cheapest_free"` | Rule hint (percent vs free item) |
| `applies_to_group`     | `"coffee"`          | Only valid for matching products           |
| `max_uses_per_customer`| `1`                 | Soft limit (checked client-side)           |

---

## 4. Checkout / Order-level (`Checkout Session.metadata`)
| Key                    | Example value        | Purpose / UI label                     |
|------------------------|----------------------|----------------------------------------|
| `order_type`           | `"bundle"`           | Fulfillment routing                    |
| `campaign`             | `"SUMMER25"`         | Mirrors coupon tag for analytics       |
| `gift_note`            | `"Happy birthday!"`  | Printed on packing slip                |
| `gift_recipient_email` | `"mom@mail.com"`     | Digital gift delivery                  |

---

## 5. Shipping / Customs extras
| Key                 | Example value | Purpose / UI label                    |
|---------------------|---------------|---------------------------------------|
| `customs_hs_code`   | `"090111"`    | International shipping code           |
| `country_of_origin` | `"CO"`        | ISO-2 customs field                   |
| `fragile`           | `"true"`      | Packing instruction                   |

---

### Usage in admin UI labels
- **Product form**  
  - Label: “SEO Title” → map to `seo_title`  
  - Label: “Pack Size (units)” → map to `pack_size`  

- **Pack builder**  
  - Label: “Contents (Price IDs)” → map to `contents`  

- **Coupon builder**  
  - Label: “Campaign tag” → map to `campaign`  
  - Label: “Minimum quantity” → map to `tier_qty`  

> Always use **lowercase snake_case**.  
> These keys keep the storefront, checkout, and analytics in sync without any extra code.