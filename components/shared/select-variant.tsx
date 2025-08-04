/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function SelectVariant({ variants }: { variants: any[] }) {
  const router = useRouter();
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a variant" />
      </SelectTrigger>
      <SelectContent>
        {variants.map((variant) => (
          <SelectItem
            key={variant.id}
            value={variant.id}
            onSelect={() => {
              router.push(`/product/${variant.slug}?variant=${variant.id}`);
            }}
          >
            {variant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
