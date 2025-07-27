import type { ReactNode } from "react";
import CartAsideDrawer from "./cart-aside";

export const CartAsideContainer = ({ children }: { children: ReactNode }) => {
  return (
    <CartAsideDrawer>
      <div className="flex h-full min-h-[80vh] flex-col">{children}</div>
    </CartAsideDrawer>
  );
};
