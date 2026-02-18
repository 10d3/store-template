/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import Stripe from "stripe";
import {
  CouponFormData,
  PackFormData,
  ProductFormData,
} from "./product.schema";
import type { StripeProduct, StripeCoupon } from "@/types/product";
import { validateMetadata } from "@/lib/metadata/config";
import { transformMetadataForSubmission } from "@/lib/metadata/form-utils";
import { ProductCrudError } from "./errors";
import { prisma } from "../prisma";
import { getCachedProducts, revalidateProductCache } from "./cache";
import { getProductsByIdsFromDB } from "./db-queries";
import { syncProductToDatabase, syncPriceToDatabase } from "./product-sync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// Helper function to validate and transform metadata
function validateAndTransformMetadata(
  metadata: Record<string, any> | undefined,
  type: "product" | "price" | "coupon" | "checkout" | "shipping"
): Record<string, string | number | null> {
  if (!metadata) return {};

  const validation = validateMetadata(metadata, type);

  if (!validation.isValid) {
    throw new ProductCrudError(
      `Metadata validation failed: ${validation.errors.join(", ")}`,
      "METADATA_VALIDATION_ERROR",
      { errors: validation.errors }
    );
  }

  // Log warnings if any
  // if (validation.warnings && validation.warnings.length > 0) {
  //   console.warn("Metadata validation warnings:", validation.warnings);
  // }

  return transformMetadataForSubmission(metadata);
}

// Transform Stripe Product to plain object
function transformProduct(product: Stripe.Product): StripeProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    metadata: product.metadata,
    default_price: product.default_price,
    active: product.active,
  };
}

// Transform Stripe Coupon to plain object
function transformCoupon(coupon: Stripe.Coupon): StripeCoupon {
  return {
    id: coupon.id,
    name: coupon.name,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
    currency: coupon.currency,
    duration: coupon.duration,
    valid: coupon.valid,
    metadata: coupon.metadata,
  };
}

export async function createProduct(data: ProductFormData) {
  try {
    const validatedMetadata = validateAndTransformMetadata(
      data.metadata,
      "product"
    );

    // dont send metadata.nutrition to stripe its too long
    const metadataToSendToStripe = {
      ...validatedMetadata,
      nutrition: "",
    };

    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: data.images,
      metadata: metadataToSendToStripe,
    });

    //send the metadata.nutriton to our db instead
    const productNutrition = await prisma.productNutrition.upsert({
      where: {
        productId: product.id,
      },
      update: {
        nutrition: data.metadata?.nutrition,
      },
      create: {
        productId: product.id,
        nutrition: data.metadata?.nutrition,
      },
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: data.price,
      currency: data.currency,
    });

    //reconstruct the product before returning it
    const productWithNutrition = {
      ...product,
      metadata: {
        ...product.metadata,
        nutrition: productNutrition.nutrition,
      },
    };

    await revalidateProductCache();
    return transformProduct(productWithNutrition);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}
export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
) {
  try {
    const validatedMetadata = data.metadata
      ? validateAndTransformMetadata(data.metadata, "product")
      : undefined;

    // First, create the new price
    const newPrice = await stripe.prices.create({
      product: id, // Use the product ID directly
      unit_amount: data.price,
      currency: "usd",
      active: true,
    });

    //send the metadata.nutriton to our db instead

    const productNutrition = await prisma.productNutrition.upsert({
      where: {
        productId: id,
      },
      update: {
        nutrition: data.metadata?.nutrition,
      },
      create: {
        productId: id,
        nutrition: data.metadata?.nutrition,
      },
    });

    // dont send metadata.nutrition to stripe its too long
    const metadataToSendToStripe = {
      ...validatedMetadata,
      nutrition: "",
    };
    const product = await stripe.products.update(id, {
      name: data.name,
      description: data.description,
      images: data.images,
      metadata: metadataToSendToStripe,
      default_price: newPrice.id, // Set the new price as default
    });

    // Now safely deactivate the old price (if it exists and is different)
    if (product.default_price && product.default_price !== newPrice.id) {
      await stripe.prices.update(product.default_price as string, {
        active: false,
      });
    }

    //reconstruct the product before returning it
    const productWithNutrition = {
      ...product,
      metadata: {
        ...product.metadata,
        nutrition: productNutrition.nutrition,
      },
    };

    await revalidateProductCache();
    return transformProduct(productWithNutrition);
  } catch (error) {
    console.error("updateProduct error:", error);
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new ProductCrudError(`Failed to update product: ${errorMessage}`, "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function unarchiveProduct(id: string) {
  try {
    const product = await stripe.products.update(id, { active: true });
    await revalidateProductCache();
    return transformProduct(product);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to archive product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function archiveProduct(id: string) {
  try {
    const product = await stripe.products.update(id, { active: false });
    await revalidateProductCache();
    return transformProduct(product);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to archive product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function createCoupon(data: CouponFormData) {
  try {
    const validatedMetadata = validateAndTransformMetadata(
      data.metadata,
      "coupon"
    );

    const coupon = await stripe.coupons.create({
      ...data,
      duration: data.duration as Stripe.CouponCreateParams.Duration,
      metadata: validatedMetadata,
    });

    return transformCoupon(coupon);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create coupon", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function updateCoupon(id: string, data: CouponFormData) {
  try {
    const validatedMetadata = data.metadata
      ? validateAndTransformMetadata(data.metadata, "coupon")
      : undefined;

    const coupon = await stripe.coupons.update(id, {
      name: data.name,
      metadata: validatedMetadata,
    });

    return transformCoupon(coupon);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to update coupon", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function createPresetCoupon(preset: "4for3" | "15off3") {
  try {
    if (preset === "4for3") {
      const validatedMetadata = validateAndTransformMetadata(
        {
          type: "4for3",
          description: "Buy 3, get cheapest free",
        },
        "coupon"
      );

      const coupon = await stripe.coupons.create({
        name: "4-for-3 Deal",
        duration: "once",
        metadata: validatedMetadata,
        // Note: The actual "cheapest free" logic would be handled in checkout
        amount_off: 0, // Placeholder - actual discount calculated server-side
      });

      return transformCoupon(coupon);
    }

    if (preset === "15off3") {
      const validatedMetadata = validateAndTransformMetadata(
        {
          type: "bulk_discount",
          min_items: "3",
        },
        "coupon"
      );

      const coupon = await stripe.coupons.create({
        name: "15% off 3+ items",
        duration: "once",
        percent_off: 15,
        metadata: validatedMetadata,
      });

      return transformCoupon(coupon);
    }
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError(
      "Failed to create preset coupon",
      "UNKNOWN_ERROR",
      { originalError: error }
    );
  }
}

export async function createPack(data: PackFormData) {
  try {
    // Build pack metadata with new pack configuration
    const packMetadata: Record<string, string> = {
      type: "bundle",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() || "0",
    };

    // Add pack type if specified
    if (data.packType) {
      packMetadata.pack_type = data.packType;
    }

    // Add pack sizes configuration as JSON string
    if (data.packSizes && data.packSizes.length > 0) {
      // Strip image from metadata to save space
      const packSizesForStripe = data.packSizes.map(({ image, ...rest }: any) => rest);
      packMetadata.pack_sizes = JSON.stringify(packSizesForStripe);
    }

    // Merge with any additional metadata
    const fullMetadata = {
      ...packMetadata,
      ...data.metadata,
    };

    const validatedMetadata = validateAndTransformMetadata(
      fullMetadata,
      "product"
    );

    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: data.images || [],
      metadata: validatedMetadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: data.packPrice,
      currency: "usd",
    });

    await stripe.products.update(product.id, {
      default_price: price.id,
    });

    // Create prices for pack sizes if they exist
    if (data.packSizes && data.packSizes.length > 0) {
      const updatedPackSizes = await Promise.all(
        data.packSizes.map(async (sizeConfig) => {
          if (sizeConfig.enabled && sizeConfig.fixedPrice) {
            // Create a price for this pack size
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

            // Sync price to database
            await syncPriceToDatabase(sizePrice, false);

            return {
              ...sizeConfig,
              stripePriceId: sizePrice.id,
            };
          }
          return sizeConfig;
        })
      );

      // Update metadata with the new price IDs
      const finalProduct = await stripe.products.update(product.id, {
        metadata: {
          ...validatedMetadata,
          pack_sizes: JSON.stringify(updatedPackSizes),
        },
      });

      // Sync the final product state to the database
      await syncProductToDatabase(finalProduct as Stripe.Product);
    } else {
      // If no pack sizes, still sync the initial product creation
      await syncProductToDatabase(product as Stripe.Product);
    }

    await revalidateProductCache();
    return transformProduct({
      ...product,
      default_price: price.id,
    });
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create pack", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function updatePack(id: string, data: PackFormData) {
  console.log(data);
  try {
    // Build pack metadata with new pack configuration
    const packMetadata: Record<string, string> = {
      type: "bundle",
      bundle_type: data.metadata?.bundle_type || "",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() || "0",
      category: data.metadata?.category || "",
    };

    // Add pack type if specified
    if (data.packType) {
      packMetadata.pack_type = data.packType;
    }

    // Add pack sizes configuration as JSON string
    if (data.packSizes && data.packSizes.length > 0) {
      // Strip image from metadata to save space
      const packSizesForStripe = data.packSizes.map(({ image, ...rest }: any) => rest);
      packMetadata.pack_sizes = JSON.stringify(packSizesForStripe);
    }

    const validatedMetadata = validateAndTransformMetadata(
      packMetadata,
      "product"
    );

    // First, create the new price
    const newPrice = await stripe.prices.create({
      product: id, // Use the product ID directly
      unit_amount: data.packPrice,
      currency: "usd",
      active: true,
    });

    // Update the product with new metadata and default price
    const product = await stripe.products.update(id, {
      name: data.name,
      description: data.description,
      images: data.images || [],
      metadata: validatedMetadata,
      default_price: newPrice.id, // Set the new price as default
    });

    // Now safely deactivate the old price (if it exists and is different)
    if (product.default_price && product.default_price !== newPrice.id) {
      await stripe.prices.update(product.default_price as string, {
        active: false,
      });
    }

    // Handle pack sizes prices
    if (data.packSizes && data.packSizes.length > 0) {
      const updatedPackSizes = await Promise.all(
        data.packSizes.map(async (sizeConfig) => {
          if (sizeConfig.enabled && sizeConfig.fixedPrice) {
            // Check if we need to create a new price
            // If we have a price ID, we assume it's valid, but ideally we should verify amount.
            // For now, let's create a new price if the ID is missing OR if we want to enforce update.
            // Simplest approach: If ID is missing, create it.
            // If ID is present, we *could* retrieve it and check amount, but that is slow.
            // A better optimization: If the form sends back the ID, we assume it matches the *previous* state.
            // But if the user *changed* the fixedPrice in the UI, does the UI blank out the ID?
            // The UI logic in pack-form doesn't seem to clear ID on change currently.
            // So we should probably just ALWAYS create a new price for enabled sizes on update to be safe,
            // or at least if we don't implement price update logic (which is complicated). 
            // Creating new prices is safe. Archiving old ones is better hygiene but optional for now.

            // Let's create a new price to be sure it matches the current configuration
            const sizePrice = await stripe.prices.create({
              product: id,
              unit_amount: sizeConfig.fixedPrice,
              currency: "usd",
              metadata: {
                pack_size: sizeConfig.size.toString(),
                generated_for: "pack_size",
                image: sizeConfig.image || "",
              },
            });

            // Sync price to database
            await syncPriceToDatabase(sizePrice, false);

            return {
              ...sizeConfig,
              stripePriceId: sizePrice.id,
            };
          }
          return sizeConfig;
        })
      );

      // Update metadata with new price IDs
      const packSizesForStripe = updatedPackSizes.map(({ image, ...rest }: any) => rest);
      await stripe.products.update(id, {
        metadata: {
          ...validatedMetadata,
          pack_sizes: JSON.stringify(packSizesForStripe),
        }
      });

      // We should return the product with the updated metadata
      const updatedProduct = await stripe.products.retrieve(id, { expand: ["default_price"] });

      // Sync to database to ensure storefront has latest data
      await syncProductToDatabase(updatedProduct as Stripe.Product);

      await revalidateProductCache();
      return transformProduct(updatedProduct as Stripe.Product);
    }

    // Sync normal updates as well
    const updatedSimpleProduct = await stripe.products.retrieve(id, { expand: ["default_price"] });
    await syncProductToDatabase(updatedSimpleProduct as Stripe.Product);

    await revalidateProductCache();
    return transformProduct(product);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to update pack", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function listProducts(): Promise<StripeProduct[]> {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 100,
    });

    // Step 1: fetch all nutrition in a single query
    const productIds = products.data.map((p) => p.id);
    const nutritionData = await prisma.productNutrition.findMany({
      where: { productId: { in: productIds } },
    });

    const nutritionMap = new Map(
      nutritionData.map((n) => [n.productId, n.nutrition])
    );

    // Step 2: merge nutrition into metadata
    const productsWithNutrition = products.data.map((product) => {
      const metadata = { ...product.metadata };
      const nutrition = nutritionMap.get(product.id);
      if (nutrition) metadata.nutrition = nutrition;

      return {
        ...product,
        metadata,
      };
    });

    // Step 3: transform to StripeProduct
    return productsWithNutrition.map(transformProduct);
  } catch (error) {
    console.error("Error in listProducts:", error);
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to list products", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}


export async function getProduct(slug: string) {
  try {
    const products = await listProducts();
    const variants = products.filter(
      (product) => product.metadata.slug === slug
    );
    return variants;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to get product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function listCoupons(): Promise<StripeCoupon[]> {
  try {
    const coupons = await stripe.coupons.list({ limit: 100 });
    return coupons.data.map(transformCoupon);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to list coupons", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function getProductsByPriceIds(
  priceIds: string[]
): Promise<StripeProduct[]> {
  try {
    const products: StripeProduct[] = [];

    // Fetch each price and its associated product
    for (const priceId of priceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId.trim(), {
          expand: ["product"],
        });

        if (price.product && typeof price.product === "object") {
          const transformedProduct = transformProduct(
            price.product as Stripe.Product
          );
          // Set the default_price to the specific price we fetched
          transformedProduct.default_price = {
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
          };
          products.push(transformedProduct);
        }
      } catch (priceError) {
        console.warn(`Failed to fetch price ${priceId}:`, priceError);
        // Continue with other prices even if one fails
      }
    }

    return products;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError(
      "Failed to get products by price IDs",
      "UNKNOWN_ERROR",
      {
        originalError: error,
      }
    );
  }
}

export async function getProductsByProductIds(
  productIds: string[]
): Promise<StripeProduct[]> {
  try {
    // Use database for fast reads instead of individual Stripe API calls
    const trimmedIds = productIds.map(id => id.trim()).filter(Boolean);
    return await getProductsByIdsFromDB(trimmedIds);
  } catch (error) {
    console.error("Error fetching products by IDs from DB:", error);
    // Return empty array on error to not break the page
    return [];
  }
}

export async function getPacks() {
  // Use cached products instead of making direct Stripe API calls
  const products = await getCachedProducts();
  const packs = products.filter(
    (product) => product.metadata.type === "bundle"
  );
  return packs;
}

export async function getPack(productId: string) {
  // Use cached products for faster loading
  const products = await getCachedProducts();
  const packs = products.filter(
    (product) =>
      product.metadata.type === "bundle" &&
      product.metadata.contents?.includes(productId)
  );
  return packs;
}

// ============ COLLECTION FUNCTIONS ============

/**
 * Get all products in a specific collection
 */
export async function getProductsByCollection(
  collectionSlug: string
): Promise<StripeProduct[]> {
  try {
    const products = await listProducts();
    const collectionProducts = products
      .filter(
        (product) =>
          product.metadata?.collection === collectionSlug &&
          product.metadata?.type !== "bundle" // Exclude bundles
      )
      .sort((a, b) => {
        const orderA = parseInt(a.metadata?.collection_order || "999");
        const orderB = parseInt(b.metadata?.collection_order || "999");
        return orderA - orderB;
      });
    return collectionProducts;
  } catch (error) {
    console.error("Error fetching collection products:", error);
    return [];
  }
}

/**
 * Get related products for a specific product
 * Falls back to same-category products if no related_products metadata is set
 */
export async function getRelatedProducts(
  productId: string,
  limit: number = 4
): Promise<StripeProduct[]> {
  try {
    // Use cached products instead of making direct Stripe API calls
    const products = await getCachedProducts();
    const currentProduct = products.find((p) => p.id === productId);

    if (!currentProduct) return [];

    // First try to get explicitly set related products
    if (currentProduct.metadata?.related_products) {
      const relatedIds = currentProduct.metadata.related_products
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const relatedProducts = products.filter(
        (p) => relatedIds.includes(p.id) && p.id !== productId
      );

      if (relatedProducts.length > 0) {
        return relatedProducts.slice(0, limit);
      }
    }

    // Fallback: get products from same category
    const category = currentProduct.metadata?.category;
    if (category) {
      const sameCategoryProducts = products.filter(
        (p) =>
          p.metadata?.category === category &&
          p.id !== productId &&
          p.metadata?.type !== "bundle"
      );
      return sameCategoryProducts.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(
  limit: number = 8
): Promise<StripeProduct[]> {
  try {
    const products = await listProducts();
    const featured = products.filter(
      (p) =>
        p.metadata?.featured === "true" && p.metadata?.type !== "bundle"
    );
    return featured.slice(0, limit);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Get all unique collections from product metadata
 */
export async function getCollections(): Promise<
  { slug: string; productCount: number }[]
> {
  try {
    const products = await listProducts();
    const collectionMap = new Map<string, number>();

    products.forEach((product) => {
      const collection = product.metadata?.collection;
      if (collection && product.metadata?.type !== "bundle") {
        collectionMap.set(collection, (collectionMap.get(collection) || 0) + 1);
      }
    });

    return Array.from(collectionMap.entries()).map(([slug, productCount]) => ({
      slug,
      productCount,
    }));
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

export async function getArchivedProducts(): Promise<StripeProduct[]> {
  try {
    const products = await stripe.products.list({
      active: false,
    })
    return products.data;
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
}

// export async function unarchiveProduct(productId: string) {
//     try {
//         await stripe.products.update(productId, {
//             active: true,
//         })
//     } catch (error) {
//         console.error("Error unarchiving product:", error);
//     }
// }
