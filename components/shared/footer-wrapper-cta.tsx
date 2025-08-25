import { type ReactNode } from "react";

export default function FooterWrapperCta({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-screen flex flex-col gap-4 bg-background px-4 md:px-24">
      <div>{/* placeholder for footer cta */}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}
