import Link from "next/link";
import { getCategories, getCollections } from "@/lib/catalog/queries";
import { Container } from "./container";

export async function Footer() {
  const [categories, collections] = await Promise.all([
    getCategories(),
    getCollections(),
  ]);

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-serif text-xl">Vitanou</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Everyday wellness essentials, chosen with care and shipped with
            respect for your time.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Shop</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/shop" className="hover:text-foreground">
                All products
              </Link>
            </li>
            {categories.slice(0, 4).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Collections</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {collections.slice(0, 4).map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collection/${collection.slug}`}
                  className="hover:text-foreground"
                >
                  {collection.name}
                </Link>
              </li>
            ))}
            {collections.length === 0 && <li>Coming soon</li>}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Help</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-foreground">
                Shipping &amp; returns
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-foreground">
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-border/60 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Vitanou. All rights reserved.</p>
        <p>Secure checkout powered by Stripe.</p>
      </Container>
    </footer>
  );
}
