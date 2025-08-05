import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCartStore } from "@/lib/store";
import { ShoppingBagIcon } from "lucide-react";
import { Suspense } from "react";
import { CartLink } from "./cart-link";
import { Badge } from "@/components/ui/badge";

const CartFallback = () => (
  <div className="h-6 w-6 opacity-30">
    <ShoppingBagIcon />
  </div>
);

export const CartSummaryNav = () => {
  return (
    <Suspense fallback={<CartFallback />}>
      <CartSummaryNavInner />
    </Suspense>
  );
};

const CartSummaryNavInner = () => {
  const { cart, getTotalPrice } = useCartStore();
  if (!cart) {
    return <CartFallback />;
  }
  if (!cart.length) {
    return <CartFallback />;
  }

  const total = getTotalPrice();
  const totalItems = cart.reduce((acc, line) => acc + line.quantity, 0);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div>
            <CartLink>
              <ShoppingBagIcon />
              <div className="absolute -top-2 -right-2">
                <Badge
                  variant="default"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  <span>{totalItems > 99 ? "99+" : totalItems}</span>
                </Badge>
              </div>
              <span className="sr-only">Total: {total}</span>
            </CartLink>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={25}>
          <p>Total items: {totalItems}</p>
          <p>Total: {total}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
