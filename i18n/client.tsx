"use client";
import { getNestedValue, invariant } from "@/lib/utils";
import { type ReactNode, createContext, use } from "react";
import { getMessagesInternal } from "./server";
import type { IntlNamespaceKeys, FlattenedKeys } from "./types";
import { IntlMessageFormat } from "intl-messageformat";

type IntlClientProviderValue = { messages: IntlMessages; locale: string };
const IntlClientContext = createContext<IntlClientProviderValue | null>(null);

export const IntlClientProvider = ({
  messages,
  locale,
  children,
}: {
  messages: IntlMessages;
  locale: string;
  children: ReactNode;
}) => {
  return (
    <IntlClientContext.Provider value={{ locale, messages }}>
      {children}
    </IntlClientContext.Provider>
  );
};

export const useTranslations = <TNamespaceKey extends IntlNamespaceKeys>(
  namespaceKey: TNamespaceKey
) => {
  const ctx = use(IntlClientContext);
  invariant(ctx, "useTranslations must be used within a IntlClientProvider");
  return getMessagesInternal(namespaceKey, ctx.locale, ctx.messages);
};

// Alternative hook for flat keys
export const useFlatTranslations = () => {
  const ctx = use(IntlClientContext);
  invariant(
    ctx,
    "useFlatTranslations must be used within a IntlClientProvider"
  );

  return <TMessageKey extends FlattenedKeys<IntlMessages>>(
    key: TMessageKey,
    values?: Record<string, string | number | undefined>
  ) => {
    const msg = getNestedValue(ctx.messages, key);
    if (!msg) {
      return "";
    }

    try {
      const message =
        new IntlMessageFormat(msg, ctx.locale).format(values)?.toString() ?? "";
      return message;
    } catch (error) {
      console.error(`Error formatting message: ${key}`, error);
      return String(msg);
    }
  };
};
