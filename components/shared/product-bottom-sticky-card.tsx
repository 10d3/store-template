import { cn, formatPrice } from "@/lib/utils";
import { StripeProduct } from "@/types/product";
// import { MainProductImage } from "@/ui/products/main-product-image";
import AddToCartButton from "./add-to-cart-button";
import Image from "next/image";

export const ProductBottomStickyCard = ({
  product,
  show,
}: {
  product: StripeProduct;
  show: boolean;
}) => {
  return (
    <div
      tabIndex={show ? 0 : -1}
      className={cn(
        "md:hidden fixed bottom-0 max-w-[100vw] left-0 right-0 bg-background/90 backdrop-blur-xs border-t py-2 sm:py-4 transition-all duration-300 ease-out z-10",
        show
          ? "transform translate-y-0 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.1),_0_-2px_4px_-2px_rgb(0_0_0_/_0.1)]"
          : "transform translate-y-full"
      )}
    >
      <div className="mx-auto w-full max-w-7xl gap-x-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-x-2 sm:gap-x-4 min-w-0">
          <div className="shrink-0">
            {product.images && (
              <Image
                className="w-16 h-16 rounded-lg bg-background-100 object-cover object-center"
                src={product.images?.[0] ?? ""}
                loading="eager"
                priority
                alt=""
                width={700}
                height={700}
                sizes="(max-width: 1024x) 100vw, (max-width: 1280px) 50vw, 700px"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-base md:text-lg whitespace-nowrap text-ellipsis overflow-clip">
              {product.name}
            </h3>

            {typeof product.default_price === "object" &&
              product.default_price?.unit_amount && (
                <p className="text-xs sm:text-sm">
                  {formatPrice(product.default_price.unit_amount)}
                </p>
              )}
          </div>
        </div>

        <AddToCartButton
          product={product}
          //   className="px-3 text-sm sm:text-lg sm:px-8 shrink-0 h-9 sm:h-10"
        />
      </div>
    </div>
  );
};
