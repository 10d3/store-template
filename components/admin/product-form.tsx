"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { upsertProduct, type ActionState } from "@/lib/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import type {
  AdminImage,
  AdminProductFormData,
  AdminVariant,
} from "@/lib/admin/product-form";

const blankVariant: AdminVariant = {
  title: "Default",
  sku: "",
  price: "",
  compareAtPrice: "",
  cost: "",
  stock: "0",
  trackInventory: true,
  active: true,
  options: "",
  image: "",
};

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product?: AdminProductFormData;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    upsertProduct,
    {}
  );
  const [images, setImages] = useState<AdminImage[]>(product?.images ?? []);
  const [variants, setVariants] = useState<AdminVariant[]>(
    product?.variants.length ? product.variants : [{ ...blankVariant }]
  );

  function updateVariant(index: number, patch: Partial<AdminVariant>) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    );
  }

  function updateImage(index: number, patch: Partial<AdminImage>) {
    setImages((current) =>
      current.map((image, i) => (i === index ? { ...image, ...patch } : image))
    );
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(
          variants.map((variant) => ({
            ...variant,
            compareAtPrice: variant.compareAtPrice || undefined,
            cost: variant.cost || undefined,
          }))
        )}
      />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
        <h2 className="font-medium">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Name</span>
            <input
              name="name"
              defaultValue={product?.name ?? ""}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Slug</span>
            <input
              name="slug"
              defaultValue={product?.slug ?? ""}
              placeholder="auto from name"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={product?.description ?? ""}
            rows={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span>Status</span>
            <select
              name="status"
              defaultValue={product?.status ?? "DRAFT"}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Category</span>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4"
            />
            <span>Featured on home</span>
          </label>
        </div>

        <div className="space-y-2 text-sm">
          <span>Collections</span>
          <div className="flex flex-wrap gap-4">
            {collections.length === 0 && (
              <span className="text-muted-foreground">No collections yet.</span>
            )}
            {collections.map((collection) => (
              <label key={collection.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="collectionIds"
                  value={collection.id}
                  defaultChecked={product?.collectionIds.includes(collection.id)}
                  className="h-4 w-4"
                />
                {collection.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex items-center gap-2">
          <ImageUploader
            onUploaded={(urls) =>
              setImages((current) => [
                ...current,
                ...urls.map((url) => ({ url, alt: "" })),
              ])
            }
          />
          <button
            type="button"
            onClick={() => setImages((current) => [...current, { url: "", alt: "" }])}
            className="rounded-md border border-border px-3 py-1.5 text-xs"
          >
            Add URL
          </button>
        </div>
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground">No images yet.</p>
        )}
        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-[auto_1fr_auto]"
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.alt || "Product image"}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-md border border-dashed border-border" />
              )}
              <div className="space-y-2">
                <input
                  value={image.url}
                  onChange={(event) => updateImage(index, { url: event.target.value })}
                  placeholder="Image URL or upload"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={image.alt}
                  onChange={(event) => updateImage(index, { alt: event.target.value })}
                  placeholder="Alt text"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-start gap-1 sm:flex-col">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  aria-label="Move image up"
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move image down"
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                  className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Variants</h2>
            <p className="text-xs text-muted-foreground">
              Prices in dollars. Removing a saved variant deletes it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((current) => [...current, { ...blankVariant, title: "" }])}
            className="rounded-md border border-border px-3 py-1.5 text-xs"
          >
            Add variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Variant {index + 1}</h3>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((current) => current.filter((_, i) => i !== index))
                    }
                    className="text-xs text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs">
                  <span>Title</span>
                  <input
                    value={variant.title}
                    onChange={(event) => updateVariant(index, { title: event.target.value })}
                    placeholder="Default"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span>SKU</span>
                  <input
                    value={variant.sku}
                    onChange={(event) => updateVariant(index, { sku: event.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span>Price</span>
                  <input
                    value={variant.price}
                    onChange={(event) => updateVariant(index, { price: event.target.value })}
                    inputMode="decimal"
                    required
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span>Compare at</span>
                  <input
                    value={variant.compareAtPrice}
                    onChange={(event) =>
                      updateVariant(index, { compareAtPrice: event.target.value })
                    }
                    inputMode="decimal"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span>Cost</span>
                  <input
                    value={variant.cost}
                    onChange={(event) => updateVariant(index, { cost: event.target.value })}
                    inputMode="decimal"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span>Stock</span>
                  <input
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, { stock: event.target.value })}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs sm:col-span-2">
                  <span>Image URL</span>
                  <input
                    value={variant.image}
                    onChange={(event) => updateVariant(index, { image: event.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex items-end gap-4 pb-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.trackInventory}
                      onChange={(event) =>
                        updateVariant(index, { trackInventory: event.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    Track stock
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(event) =>
                        updateVariant(index, { active: event.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    Active
                  </label>
                </div>
              </div>

              <label className="space-y-1 text-xs">
                <span>Options JSON (optional, e.g. {`{"size":"30 servings"}`})</span>
                <input
                  value={variant.options}
                  onChange={(event) => updateVariant(index, { options: event.target.value })}
                  placeholder="{}"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
        <h2 className="font-medium">SEO</h2>
        <label className="space-y-1 text-sm">
          <span>SEO title</span>
          <input
            name="seoTitle"
            defaultValue={product?.seoTitle ?? ""}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>SEO description</span>
          <textarea
            name="seoDescription"
            defaultValue={product?.seoDescription ?? ""}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </section>

      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save product" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-md border border-border px-5 py-2.5 text-sm"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}


