/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { validateMetadata } from "@/lib/metadata/config";

/**
 * Custom validation function for metadata fields in forms
 * Can be used with react-hook-form's validate option
 */
export function createMetadataValidator(type: 'product' | 'price' | 'coupon' | 'checkout' | 'shipping') {
  return (metadata: Record<string, string> | undefined) => {
    if (!metadata) return true;
    
    // Filter out empty values
    const filteredMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, value]) => value !== "" && value !== undefined && value !== null)
    );
    
    if (Object.keys(filteredMetadata).length === 0) return true;
    
    const validation = validateMetadata(filteredMetadata, type);
    
    if (!validation.isValid) {
      return validation.errors.join(", ");
    }
    
    return true;
  };
}

/**
 * Transform metadata for submission to Stripe
 * Converts all values to strings, numbers, or null as required by Stripe
 */
export function transformMetadataForSubmission(
  metadata: Record<string, any>
): Record<string, string | number | null> {
  const transformed: Record<string, string | number | null> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) {
      continue; // Skip undefined values
    }
    
    if (value === null) {
      transformed[key] = null;
    } else if (typeof value === 'boolean') {
      transformed[key] = value.toString();
    } else if (typeof value === 'number') {
      transformed[key] = value;
    } else if (Array.isArray(value)) {
      transformed[key] = value.join(',');
    } else {
      transformed[key] = String(value);
    }
  }
  
  return transformed;
}

/**
 * Transform Stripe metadata back to form-friendly format
 * Converts string booleans back to booleans for form fields
 */
export function transformMetadataFromStripe(
  metadata: Record<string, string> | undefined,
  type: 'product' | 'price' | 'coupon' | 'checkout' | 'shipping'
): Record<string, any> {
  if (!metadata) return {};
  
  const transformed: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    // Convert string booleans back to actual booleans
    if (value === "true") {
      transformed[key] = true;
    } else if (value === "false") {
      transformed[key] = false;
    } else if (!isNaN(Number(value)) && value !== "") {
      // Keep numbers as strings for form inputs, but could be converted if needed
      transformed[key] = value;
    } else {
      transformed[key] = value;
    }
  }
  
  return transformed;
}