import { listProducts } from "@/lib/product/crud"
import Image from "next/image"
import { CopyLinkButton } from "./_components/copy-link-button"
import { getBaseURL } from "@/lib/utils"
import { getRefferalCode } from "@/lib/affiliation/affiliate-data"

export default async function page() {
  const refferalCode = await getRefferalCode()
  const products = await listProducts()
  const transformedDataProduct = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product?.description || "",
    image: product?.images?.[0] as string,
    metadata: product.metadata,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Products affiliate links</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        {transformedDataProduct.map((product) => (
          <div
            key={product.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 rounded-2xl bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md w-full"
          >
            {/* Product Image */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>

            {/* Product Info */}
            <div className="flex-1 w-full sm:w-auto">
              <h3 className="text-sm sm:text-base font-medium text-foreground">{product.name}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 rounded-lg bg-muted px-3 py-2 sm:px-4 sm:py-3 w-full sm:w-auto">
              <div className="flex-1 sm:max-w-xs overflow-hidden">
                <p className=" truncate text-sm text-muted-foreground">
                  {`${getBaseURL()}/product/${product.metadata.slug}?ref=${refferalCode}`}
                </p>
                {/* <p className="sm:hidden truncate text-xs text-muted-foreground">Click to copy link</p> */}
              </div>
              <CopyLinkButton
                productId={product.id}
                link={`${getBaseURL()}/product/${product.metadata.slug}?ref=${refferalCode}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
