"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { useCartStore, cartCount } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";

export function NavActions({
  user,
}: {
  user: { name: string; role?: string | null } | null;
}) {
  const [mounted, setMounted] = useState(false);
  const count = useCartStore((state) => cartCount(state.items));

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-1">
      {user?.role === "admin" && (
        <Button asChild variant="ghost" size="icon" aria-label="Admin">
          <Link href="/admin">
            <LayoutDashboard className="size-5" />
          </Link>
        </Button>
      )}
      <Button asChild variant="ghost" size="icon" aria-label="Account">
        <Link href={user ? "/account" : "/login"}>
          <User className="size-5" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
        <Link href="/cart">
          <ShoppingBag className="size-5" />
          {mounted && count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      </Button>
    </div>
  );
}
