import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCategories } from "@/lib/catalog/queries";
import { getSession } from "@/lib/session";
import { Container } from "./container";
import { NavActions } from "./nav-actions";

export async function Navbar() {
  const [categories, session] = await Promise.all([getCategories(), getSession()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="shrink-0" aria-label="Vitanou home">
          <Logo className="h-5" />
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href="/shop" className="transition hover:text-muted-foreground">
            Shop
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="transition hover:text-muted-foreground"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/about" className="transition hover:text-muted-foreground">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-muted-foreground">
            Contact
          </Link>
        </nav>

        <form action="/shop" className="ml-auto hidden max-w-xs flex-1 md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              placeholder="Search products"
              className="h-9 w-full rounded-full border border-border bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus:border-foreground"
            />
          </label>
        </form>

        <div className="ml-auto md:ml-0">
          <NavActions
            user={
              session
                ? { name: session.user.name, role: session.user.role }
                : null
            }
          />
        </div>
      </Container>

      <div className="border-t border-border/60 md:hidden">
        <Container className="flex h-12 items-center gap-4 overflow-x-auto text-sm">
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
