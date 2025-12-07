/**
 * Storefront Metadata Configuration
 * Defines predefined metadata keys for consistent data structure
 */

export interface MetadataField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "textarea" | "multi-select";
  placeholder?: string;
  options?: string[];
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

// Product-level metadata fields
export const PRODUCT_METADATA_FIELDS: MetadataField[] = [
  {
    key: "category",
    label: "Category",
    type: "select",
    options: ["coffee", "tea", "accessories", "merchandise", "men", "women"],
    description: "Navigation & filters",
    placeholder: "Select category",
  },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["men", "women", "unisex"],
    description: "Target gender for clothing/apparel products",
    placeholder: "Select gender",
  },
  {
    key: "tags",
    label: "Tags",
    type: "text",
    description: "Search / marketing tags (comma-separated)",
    placeholder: "organic,fair-trade,premium",
  },
  {
    key: "collection",
    label: "Collection",
    type: "select",
    options: ["new-arrivals", "best-sellers", "summer-essentials", "gift-ideas", "sale"],
    description: "Curated collection for product grouping",
    placeholder: "Select collection",
  },
  {
    key: "collection_order",
    label: "Collection Order",
    type: "number",
    description: "Sort order within a collection (lower = first)",
    placeholder: "1",
    min: 0,
  },
  {
    key: "related_products",
    label: "Related Products",
    type: "text",
    description: "Comma-separated product IDs to show as related",
    placeholder: "prod_abc123,prod_def456",
  },
  {
    key: "featured",
    label: "Featured Product",
    type: "boolean",
    description: "Show in featured sections on homepage",
  },
  {
    key: "seo_title",
    label: "SEO Title",
    type: "text",
    description: "<title> override for search engines",
    placeholder: "Colombia Coffee 250g - Premium Single Origin",
  },
  {
    key: "seo_description",
    label: "SEO Description",
    type: "textarea",
    description: '<meta name="description"> for search engines',
    placeholder: "Single-origin beans from the mountains of Colombia...",
  },
  {
    key: "pack_size",
    label: "Pack Size (units)",
    type: "number",
    description: "Number of units inside this SKU",
    placeholder: "3",
    min: 1,
  },
  {
    key: "bundle_type",
    label: "Bundle Type",
    type: "select",
    options: ["fixed", "build_your_own"],
    description: "Fixed = pre-defined products; Build Your Own = customer picks",
    placeholder: "Select bundle type",
  },
  {
    key: "pricing_type",
    label: "Pricing Type",
    type: "select",
    options: ["percentage", "tiered", "fixed_price"],
    description: "How to calculate bundle discount",
    placeholder: "Select pricing type",
  },
  {
    key: "fixed_discount_percent",
    label: "Fixed Discount %",
    type: "number",
    description: "Discount percentage for 'percentage' pricing type",
    placeholder: "15",
    min: 0,
    max: 100,
  },
  {
    key: "fixed_bundle_price",
    label: "Fixed Bundle Price (cents)",
    type: "number",
    description: "Fixed price for 'fixed_price' pricing type",
    placeholder: "2500",
    min: 0,
  },
  {
    key: "tier_config",
    label: "Tier Configuration",
    type: "textarea",
    description: "JSON array for tiered discounts: [{\"min\":3,\"percent\":10},{\"min\":5,\"percent\":15}]",
    placeholder: "[{\"min\":3,\"percent\":10},{\"min\":5,\"percent\":15}]",
  },
  {
    key: "min_items",
    label: "Minimum Items",
    type: "number",
    description: "Minimum items customer must select",
    placeholder: "3",
    min: 1,
  },
  {
    key: "max_items",
    label: "Maximum Items",
    type: "number",
    description: "Maximum items customer can select",
    placeholder: "5",
    min: 1,
  },
  {
    key: "contents",
    label: "Contents (Price IDs)",
    type: "text",
    description: "Price IDs inside a virtual bundle (comma list)",
    placeholder: "price_1abc,price_2def",
  },
  {
    key: "variant_group",
    label: "Variant Group",
    type: "select",
    options: ["color", "size", "flavor", "roast"],
    description: "Filters variants for swatches",
    placeholder: "Select variant group",
  },
  {
    key: "weight_grams",
    label: "Weight (grams)",
    type: "number",
    description: "Shipping calculator",
    placeholder: "250",
    min: 1,
  },
  {
    key: "digital",
    label: "Digital Product",
    type: "boolean",
    description: "Skips shipping / inventory",
  },
  {
    key: "subscription_only",
    label: "Subscription Only",
    type: "boolean",
    description: "Hide from one-time cart",
  },
  {
    key: "gift_card",
    label: "Gift Card",
    type: "boolean",
    description: "Skip inventory checks",
  },
  {
    key: "slug",
    label: "Product Slug",
    type: "text",
    description: "Unique product identifier",
    placeholder: "colombia-coffee-250g",
  },
  {
    key: "discount",
    label: "Discount",
    type: "number",
    description: "Discount amount",
    placeholder: "10",
    min: 0,
  },
  {
    key: "nutrition",
    label: "Nutrition",
    type: "textarea",
    description: "Nutrition information",
    placeholder: "Calories: 200, Protein: 10g, Fat: 5g, Carbs: 30g",
  },
];

// Price-level metadata fields
export const PRICE_METADATA_FIELDS: MetadataField[] = [
  {
    key: "discount_group",
    label: "Discount Group",
    type: "select",
    options: ["coffee", "tea", "accessories", "all"],
    description: "Coupon targeting group",
    placeholder: "Select discount group",
  },
  {
    key: "tier",
    label: "Quantity Tier",
    type: "number",
    description: "Quantity-tier trigger (3, 6, etc.)",
    placeholder: "3",
    min: 1,
  },
  {
    key: "discount_percent",
    label: "Auto Discount %",
    type: "number",
    description: "Auto-apply % when tier reached",
    placeholder: "15",
    min: 0,
    max: 100,
  },
  {
    key: "max_per_customer",
    label: "Max Per Customer",
    type: "number",
    description: "Purchase limit",
    placeholder: "5",
    min: 1,
  },
  {
    key: "sku",
    label: "SKU",
    type: "text",
    description: "Internal barcode / ERP code",
    placeholder: "COF-001",
  },
  {
    key: "color",
    label: "Color",
    type: "text",
    description: "Variant descriptor",
    placeholder: "black",
  },
  {
    key: "size",
    label: "Size",
    type: "text",
    description: "Variant descriptor",
    placeholder: "medium",
  },
];

// Coupon-level metadata fields
export const COUPON_METADATA_FIELDS: MetadataField[] = [
  {
    key: "campaign",
    label: "Campaign Tag",
    type: "text",
    description: "Attribution / analytics tag",
    placeholder: "SUMMER25",
  },
  {
    key: "tier_qty",
    label: "Minimum Quantity",
    type: "number",
    description: "Minimum quantity for discount to trigger",
    placeholder: "3",
    min: 1,
  },
  {
    key: "tier_type",
    label: "Tier Type",
    type: "select",
    options: ["percent", "cheapest_free"],
    description: "Rule hint (percent vs free item)",
    placeholder: "Select tier type",
  },
  {
    key: "applies_to_group",
    label: "Applies to Group",
    type: "select",
    options: ["coffee", "tea", "accessories", "all"],
    description: "Only valid for matching products",
    placeholder: "Select product group",
  },
  {
    key: "max_uses_per_customer",
    label: "Max Uses Per Customer",
    type: "number",
    description: "Soft limit (checked client-side)",
    placeholder: "1",
    min: 1,
  },
];

// Checkout / Order-level metadata fields
export const CHECKOUT_METADATA_FIELDS: MetadataField[] = [
  {
    key: "order_type",
    label: "Order Type",
    type: "select",
    options: ["bundle", "individual", "subscription", "gift"],
    description: "Fulfillment routing",
    placeholder: "Select order type",
  },
  {
    key: "campaign",
    label: "Campaign",
    type: "text",
    description: "Mirrors coupon tag for analytics",
    placeholder: "SUMMER25",
  },
  {
    key: "gift_note",
    label: "Gift Note",
    type: "textarea",
    description: "Printed on packing slip",
    placeholder: "Happy birthday!",
  },
  {
    key: "gift_recipient_email",
    label: "Gift Recipient Email",
    type: "text",
    description: "Digital gift delivery",
    placeholder: "recipient@example.com",
  },
];

// Shipping / Customs metadata fields
export const SHIPPING_METADATA_FIELDS: MetadataField[] = [
  {
    key: "customs_hs_code",
    label: "Customs HS Code",
    type: "text",
    description: "International shipping code",
    placeholder: "090111",
  },
  {
    key: "country_of_origin",
    label: "Country of Origin",
    type: "text",
    description: "ISO-2 customs field",
    placeholder: "CO",
  },
  {
    key: "fragile",
    label: "Fragile",
    type: "boolean",
    description: "Packing instruction",
  },
];

// Helper function to get metadata fields by type
export function getMetadataFields(
  type: "product" | "price" | "coupon" | "checkout" | "shipping"
): MetadataField[] {
  switch (type) {
    case "product":
      return PRODUCT_METADATA_FIELDS;
    case "price":
      return PRICE_METADATA_FIELDS;
    case "coupon":
      return COUPON_METADATA_FIELDS;
    case "checkout":
      return CHECKOUT_METADATA_FIELDS;
    case "shipping":
      return SHIPPING_METADATA_FIELDS;
    default:
      return [];
  }
}

// Helper function to validate metadata against schema
export function validateMetadata(
  metadata: Record<string, string>,
  type: "product" | "price" | "coupon" | "checkout" | "shipping"
): { isValid: boolean; errors: string[] } {
  const fields = getMetadataFields(type);
  const errors: string[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    const field = fields.find((f) => f.key === key);

    if (!field) {
      errors.push(`Unknown metadata key: ${key}`);
      continue;
    }

    // Validate required fields
    if (field.required && (!value || value.trim() === "")) {
      errors.push(`${field.label} is required`);
      continue;
    }

    // Validate number fields
    if (field.type === "number" && value) {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field.label} must be a number`);
      } else {
        if (field.min !== undefined && num < field.min) {
          errors.push(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && num > field.max) {
          errors.push(`${field.label} must be at most ${field.max}`);
        }
      }
    }

    // Validate select fields
    if (field.type === "select" && value && field.options) {
      if (!field.options.includes(value)) {
        errors.push(
          `${field.label} must be one of: ${field.options.join(", ")}`
        );
      }
    }

    // Validate boolean fields
    if (field.type === "boolean" && value) {
      if (!["true", "false"].includes(value.toLowerCase())) {
        errors.push(`${field.label} must be true or false`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
