/* eslint-disable @typescript-eslint/no-explicit-any */
import { IntlMessageFormat } from "intl-messageformat";
import type { IntlNamespaceKeys, NamespacedKeys, FlattenedKeys } from "./types";
import { cookies } from "next/headers";
import { getNestedValue } from "@/lib/utils";

export const getLocale = async () => {
  const cookiesStore = await cookies();
  return cookiesStore.get("NEXT_LOCALE")?.value || "en";
};

type En = typeof import("../messages/en.json");

export const getMessages = async () =>
  (
    (await import(`../messages/${await getLocale()}.json`)) as {
      default: En;
    }
  ).default;

export const getTranslations = async <TNamespaceKey extends IntlNamespaceKeys>(
  namespaceKey: TNamespaceKey
) => {
  const messages = await getMessages();
  const locale = await getLocale();
  return getMessagesInternal(namespaceKey, locale, messages);
};

export const getMessagesInternal = <TNamespaceKey extends IntlNamespaceKeys>(
  namespaceKey: TNamespaceKey,
  locale: string,
  messages: IntlMessages
) => {
  return <TMessageKey extends NamespacedKeys<IntlMessages, TNamespaceKey>>(
    key: TMessageKey,
    values?: Record<string, string | number | undefined>
  ) => {
    // Get the nested object first
    const namespace = messages[namespaceKey];
    if (!namespace || typeof namespace !== "object") {
      return "";
    }

    // Get the specific message from the namespace
    const msg = (namespace as any)[key];
    if (!msg) {
      return "";
    }

    try {
      const message =
        new IntlMessageFormat(msg, locale).format(values)?.toString() ?? "";
      return message;
    } catch (error) {
      console.error(
        `Error formatting message: ${String(namespaceKey)}.${String(key)}`,
        error
      );
      return String(msg);
    }
  };
};

// Alternative approach for flat keys (if you prefer dot notation)
export const getFlatTranslations = async () => {
  const messages = await getMessages();
  const locale = await getLocale();

  return <TMessageKey extends FlattenedKeys<IntlMessages>>(
    key: TMessageKey,
    values?: Record<string, string | number | undefined>
  ) => {
    const msg = getNestedValue(messages, key);
    if (!msg) {
      return "";
    }

    try {
      const message =
        new IntlMessageFormat(msg, locale).format(values)?.toString() ?? "";
      return message;
    } catch (error) {
      console.error(`Error formatting message: ${key}`, error);
      return String(msg);
    }
  };
};
