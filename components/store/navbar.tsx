import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCategories } from "@/lib/catalog/queries";
import { getSession } from "@/lib/session";
import { Container } from "./container";
import { NavActions } from "./nav-actions";

export async function Navbar() {
  const [categories, session] = await Promise.all([getCategories(), getSession()]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Vitanou home">
          <Image
            src="/logo_noir_png.png"
            alt="Vitanou"
            width={2000}
            height={425}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm lg:flex">
          <Link href="/shop" className="transition hover:text-brand">
            Shop
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="transition hover:text-brand"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/about" className="transition hover:text-brand">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-brand">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <form action="/shop" className="hidden md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                placeholder="Search"
                className="h-9 w-40 rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus:w-56 focus:border-brand"
              />
            </label>
          </form>
          <NavActions
            user={
              session
                ? { name: session.user.name, role: session.user.role }
                : null
            }
          />
        </div>
      </Container>

      <div className="border-t lg:hidden">
        <Container className="flex h-11 items-center gap-5 overflow-x-auto text-xs uppercase tracking-[0.14em]">
          <Link href="/shop" className="whitespace-nowrap font-medium">
            Shop all
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="whitespace-nowrap text-muted-foreground"
            >
              {category.name}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}
