import { TanstackProvider } from "@/components/tanstack-provider";
import { CartModalProvider } from "@/context/cart-modal";
import { IntlClientProvider } from "@/i18n/client";
import { getMessages, getLocale } from "@/i18n/server";
// import { NextIntlClientProvider } from "next-intl";

export default async function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <IntlClientProvider messages={messages} locale={locale}>
      <TanstackProvider>
        <CartModalProvider>{children}</CartModalProvider>
      </TanstackProvider>
    </IntlClientProvider>
  );
}
