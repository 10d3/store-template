"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ProductForm from "../../_components/form/product-form";
import { createProduct, updateProduct } from "@/lib/admin/catalog-admin";
import { type ProductWithVariants } from "@/lib/catalog";
import { type ProductFormData } from "@/lib/product/product.schema";

interface ProductEditorClientProps {
  product?: ProductWithVariants;
  products: ProductWithVariants[];
}

export default function ProductEditorClient({
  product,
  products,
}: ProductEditorClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProductFormData) =>
      product ? updateProduct(product.id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["archived-products"] });
      toast.success(
        isEditing
          ? "Product updated successfully"
          : "Product created successfully"
      );
      router.push("/admin/product");
    },
    onError: (error) => {
      toast.error(
        isEditing ? "Failed to update product" : "Failed to create product"
      );
      console.error(error);
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/product">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Edit Product" : "Create New Product"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the details, pricing, and variants for this product"
            : "Add a new product to your store catalog"}
        </p>
      </div>

      <ProductForm
        onSubmit={mutate}
        initialData={product}
        isLoading={isPending}
        products={products}
      />
    </div>
  );
}
