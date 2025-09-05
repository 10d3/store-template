"use client";

import * as React from "react";
import { Check, Copy as CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
}

export function Copy({ value, className, ...props }: CopyProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-colors hover:text-primary",
        className
      )}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setHasCopied(true);
      }}
      {...props}
    >
      {hasCopied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Copy</span>
    </button>
  );
}