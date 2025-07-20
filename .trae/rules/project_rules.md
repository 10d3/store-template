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
