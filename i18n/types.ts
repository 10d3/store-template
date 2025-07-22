/* eslint-disable @typescript-eslint/no-explicit-any */
export type IntlMessages = typeof import("../messages/en.json");

export type PathsToLeaves<T, D extends string = "."> = T extends object
  ? {
      [K in keyof T]: `${K & string}${T[K] extends object
        ? `${D}${PathsToLeaves<T[K], D>}`
        : ""}`;
    }[keyof T]
  : never;

export type IntlNamespaceKeys = keyof IntlMessages;

export type NamespacedKeys<
  M,
  N extends keyof M
> = M[N] extends Record<string, any>
  ? keyof M[N] & string
  : never;

// Better type for handling the actual nested structure
export type MessageKeys<T> = T extends Record<string, infer U>
  ? U extends string
    ? keyof T & string
    : never
  : never;

// Flatten the nested object keys
export type FlattenedKeys<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? FlattenedKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];