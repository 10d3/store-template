"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

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
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/lib/store";
import { NavUserMenu } from "./nav-user-menu";
import Image from "next/image";

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

  const session = useSession();
  const user = {
    name: session.data?.user.name as string,
    email: session.data?.user.email as string,
    avatar: session.data?.user.image as string,
  };
  const { getItemCount } = useCartStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 size-32">
              <Image src={"/logo.png"} alt="logo" width={1000} height={1000} />
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
            {session.data?.user ? (
              <NavUserMenu user={user} />
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Link>
              </Button>
            )}

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {getItemCount()}
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
              <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-muted/20">
                    <SheetTitle className="text-xl font-semibold">
                      Menu
                    </SheetTitle>
                  </div>

                  {/* Navigation Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <nav className="space-y-1">
                      {/* Home */}
                      <Link
                        href="/"
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        Home
                      </Link>

                      {/* Shop with Collapsible Submenu */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group">
                          <span>Shop</span>
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="ml-3 pl-3 border-l-2 border-muted space-y-1">
                            {categories.map((category) => (
                              <Link
                                key={category.title}
                                href={category.href}
                                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-all duration-200"
                              >
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Collections */}
                      <Link
                        href="/collections"
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        Collections
                      </Link>

                      {/* About */}
                      <Link
                        href="/about"
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        About
                      </Link>

                      {/* Contact */}
                      <Link
                        href="/contact"
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        Contact
                      </Link>
                    </nav>
                  </div>
                </div>
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
