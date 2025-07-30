import { type ReactNode } from "react";

export default function FooterWrapperCta({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-screen flex flex-col gap-4 bg-foreground">
      <div>{/* placeholder for footer cta */}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}
