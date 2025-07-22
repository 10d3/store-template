import { CartModalProvider } from "@/context/cart-modal";
import { NextIntlClientProvider } from "next-intl";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <CartModalProvider>{children}</CartModalProvider>
    </NextIntlClientProvider>
  );
}
