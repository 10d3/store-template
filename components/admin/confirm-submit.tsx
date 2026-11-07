"use client";

import type { ButtonHTMLAttributes } from "react";

export function ConfirmSubmit({
  message,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
        props.onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
