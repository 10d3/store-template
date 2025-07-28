"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store";

const categories = [
  {
    title: "Men's Fashion",
    href: "/men",
    description: "Discover the latest trends in men's clothing and accessories",
  },
  {
    title: "Women's Fashion",
    href: "/women",
    description: "Explore our curated collection of women's fashion",
  },
  {
    title: "Electronics",
    href: "/electronics",
    description: "Latest gadgets and electronic devices",
  },
  {
    title: "Home & Living",
    href: "/home",
    description: "Beautiful items for your home and lifestyle",
  },
  {
    title: "Sports & Outdoors",
    href: "/sports",
    description: "Gear up for your next adventure",
  },
  {
    title: "Beauty & Health",
    href: "/beauty",
    description: "Premium beauty and wellness products",
  },
];

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const { cart } = useCartStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  S
                </span>
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">
                STORE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                    {categories.map((category) => (
                      <ListItem
                        key={category.title}
                        title={category.title}
                        href={category.href}
                      >
                        {category.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/collections">Collections</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/contact">Contact</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Login Button */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">Login</span>
              </Link>
            </Button>

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
                <span className="sr-only">Shopping cart</span>
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link
                    href="/"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Shop</h3>
                    <div className="pl-4 space-y-2">
                      {categories.map((category) => (
                        <Link
                          key={category.title}
                          href={category.href}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {category.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/collections"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Collections
                  </Link>
                  <Link
                    href="/about"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                  <div className="pt-4 border-t">
                    <Link
                      href="/login"
                      className="flex items-center space-x-2 text-lg font-medium hover:text-primary transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>Login</span>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
