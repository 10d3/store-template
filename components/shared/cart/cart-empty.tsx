import { getTranslations } from "@/i18n/server";
import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

export async function CartEmpty() {
  const t = await getTranslations("test");
  return (
    <div className="flex max-h-80 flex-1 flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <ShoppingCartIcon className="h-12 w-12 text-neutral-500" />
        <h2 className="text-2xl font-bold tracking-tight">{t("message")}</h2>
        <p className="text-neutral-500">{t("message")}</p>
      </div>
      <Link
        className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 px-6 text-sm font-medium text-neutral-50 shadow-sm transition-colors hover:bg-neutral-900/90 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50"
        href="/"
      >
        {t("message")}
      </Link>
    </div>
  );
}
