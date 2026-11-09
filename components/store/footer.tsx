import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { getCategories, getCollections } from "@/lib/catalog/queries";
import { Container } from "./container";

const helpLinks = [
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
  { title: "Shipping & returns", href: "/shipping-returns" },
  { title: "Track an order", href: "/orders" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
];

const socialLinks = [
  {
    title: "Facebook",
    href: "https://www.facebook.com/share/1Mp4DKfcjH/",
    Icon: FaFacebook,
  },
  {
    title: "Instagram",
    href: "https://www.instagram.com/vitanou1",
    Icon: FaInstagram,
  },
  { title: "TikTok", href: "https://www.tiktok.com/@vitanou", Icon: FaTiktok },
];

const paymentIcons = [
  { src: "/visa.svg", alt: "Visa", width: 40 },
  { src: "/mastercard.svg", alt: "Mastercard", width: 40 },
  { src: "/apple-pay.svg", alt: "Apple Pay", width: 40 },
  { src: "/google-pay.svg", alt: "Google Pay", width: 40 },
  { src: "/paypal.svg", alt: "PayPal", width: 48 },
];

const shippingIcons = [
  { src: "/dhl-express.svg", alt: "DHL Express", width: 40 },
  { src: "/ups.svg", alt: "UPS", width: 40 },
  { src: "/american-express.svg", alt: "American Express", width: 40 },
  { src: "/fedex.svg", alt: "FedEx", width: 40 },
];

export async function Footer() {
  const [categories, collections] = await Promise.all([
    getCategories(),
    getCollections(),
  ]);

  return (
    <footer className="mt-20 border-t">
      <Container className="py-14">
        <Link href="/" aria-label="Vitanou home" className="mx-auto block w-fit">
          <Image
            src="/logo_noir_png.png"
            alt="Vitanou"
            width={2000}
            height={425}
            className="h-7 w-auto"
          />
        </Link>

        <p className="mx-auto mt-5 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          Everyday wellness essentials, chosen with care and shipped with
          respect for your time.
        </p>

        <nav className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm">
          <Link href="/shop" className="text-muted-foreground hover:text-brand">
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="text-muted-foreground hover:text-brand"
            >
              {category.name}
            </Link>
          ))}
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collection/${collection.slug}`}
              className="text-muted-foreground hover:text-brand"
            >
              {collection.name}
            </Link>
          ))}
          {helpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-brand"
            >
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {socialLinks.map(({ title, href, Icon }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={title}
              className="text-muted-foreground hover:text-brand"
            >
              <Icon className="size-6" />
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {paymentIcons.map((icon) => (
            <Image
              key={icon.src}
              src={icon.src}
              alt={icon.alt}
              width={icon.width}
              height={25}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {shippingIcons.map((icon) => (
            <Image
              key={icon.src}
              src={icon.src}
              alt={icon.alt}
              width={icon.width}
              height={25}
            />
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl rounded-2xl border border-foreground/20 p-5 text-center text-xs leading-relaxed text-muted-foreground">
          These statements have not been evaluated by the Food and Drug
          Administration. Vitanou products are not intended to diagnose, treat,
          cure, or prevent any disease. The information provided by Vitanou is
          for educational and wellness purposes only and should not be
          considered medical advice. Always consult your healthcare provider
          before using any dietary supplement.
        </p>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vitanou. All rights reserved. Secure
          checkout powered by Stripe.
        </p>
      </Container>
    </footer>
  );
}
