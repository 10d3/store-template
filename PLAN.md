# Implementation Plan: Dynamic Product Landing Page Data

Currently, the Vlyora-style product landing page relies on hardcoded arrays (e.g., `defaultIngredients`, `defaultTestimonials`, `defaultFAQs`, `whyChooseBullets`) inside `app/(root)/product/[slug]/page.tsx`. 

To replace this with real, editable data without breaking the layout, we will implement the following pipeline.

---

## Step 1: Define the Metadata Schema
Since the `Product` model already utilizes a flexible `metadata` field, the most efficient approach is to store these marketing blocks as stringified JSON arrays inside the product's metadata. This avoids the need for complex database migrations.

We will standardize the following metadata keys for every product:
*   `marketing_ingredients`: Stringified array of objects `{ name, amount, function }`
*   `marketing_testimonials`: Stringified array of objects `{ quote, name, rating, avatar }`
*   `marketing_faqs`: Stringified array of objects `{ question, answer }`
*   `marketing_bullets`: Stringified array of strings `["benefit 1", "benefit 2"]`
*   `marketing_cta`: Stringified object `{ title, description }`

## Step 2: Update the Admin Dashboard
To allow the store owner to easily input and update this data, we need to modify the Admin Product Editor (`/admin/product` or `/admin/product/[id]`).

*   **UI Components:** Add new collapsible sections or tabs in the product edit form for "Marketing Layout".
*   **Dynamic Forms:** Use `react-hook-form`'s `useFieldArray` to allow the admin to dynamically add, edit, or remove:
    *   FAQ items
    *   Ingredient rows
    *   Testimonials
    *   "Why Choose" bullet points
*   **Submission:** Hook into the form's `onSubmit` handler to stringify these arrays and merge them into the product's `metadata` payload before sending the `PUT`/`POST` request to the backend.

## Step 3: Wire Up `page.tsx`
Once the data is flowing from the admin dashboard into the database, we will update the frontend to consume it.

*   Replace the remaining hardcoded values in `page.tsx` with dynamic lookups.
*   Example implementation:
    ```typescript
    const faqs = parseJson(product.metadata?.marketing_faqs, defaultFAQs);
    const bullets = parseJson(product.metadata?.marketing_bullets, whyChooseBullets);
    const testimonials = parseJson(product.metadata?.marketing_testimonials, defaultTestimonials);
    ```
*   *Note:* We will keep the current hardcoded data as the `fallback` value. This ensures that if you create a new product and forget to fill out the marketing fields, the page layout won't break and will still look beautiful.

## Step 4: Data Migration (Optional)
If you already have real testimonials or FAQs for existing products, we can write a quick one-off Prisma script (`/api/migrate-marketing-data`) to seed your existing database products with their actual JSON data so you don't have to type it all manually into the admin panel.

---

### Alternative Approach (Dedicated Prisma Tables)
If you expect to reuse the *same* FAQs or Testimonials across many different products, storing them in `metadata` could get repetitive. In that case, we would:
1. Update `schema.prisma` to add `Testimonial`, `FAQ`, and `Ingredient` models.
2. Create `n:m` (many-to-many) relations between `Product` and these new tables.
3. Run `npx prisma db push` (or `migrate dev`).
*Recommendation: Stick to `metadata` first for simplicity and speed, unless you have hundreds of products.*
