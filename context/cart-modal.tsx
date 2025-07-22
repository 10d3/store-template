'use client'
import { invariant } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { createContext, ReactNode, use, useEffect, useState } from "react";

type CartModalProviderProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};
const CartModalContext = createContext<CartModalProviderProps | null>(null);

export const CartModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  return (
    <CartModalContext value={{ isOpen, setIsOpen }}>
      {children}
    </CartModalContext>
  );
};

export const useCartModal = () => {
  const ctx = use(CartModalContext);
  invariant(ctx, "useCartModal must be used within CartModalProvider");
  return ctx;
};
