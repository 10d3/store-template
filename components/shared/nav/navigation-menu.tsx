"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search, User } from "lucide-react";
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
import { NavUserMenu } from "./nav-user-menu";
import Image from "next/image";
import { CartSummaryNav } from "./cart-summary-nav";

export interface Category {
  title: string;
  href: string;
  description: string;
}

interface NavbarProps {
  shopCategories?: Category[];
  isAdmin?: boolean;
  isAffiliate?: boolean;
}

export default function Navbar({ shopCategories = [], isAdmin, isAffiliate }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const session = useSession();
  const user = {
    name: session.data?.user.name as string,
    email: session.data?.user.email as string,
    avatar: session.data?.user.image as string,
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-24">
      <div className="mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 size-32">
              <Image src={"/logo_blanc_png.png"} className="hidden dark:block" alt="logo" width={1000} height={1000} />
              <Image src={"/logo_noir_png.png"} className="block dark:hidden" alt="logo" width={1000} height={1000} />
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

              {/* <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                    {shopCategories.map((category: Category) => (
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
              </NavigationMenuItem> */}

              {/* <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/collections">Collections</Link>
                </NavigationMenuLink>
              </NavigationMenuItem> */}

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

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/blog">Insight</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar - Desktop */}
          {/* <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div> */}

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
              <NavUserMenu user={user} isAdmin={isAdmin} isAffiliate={isAffiliate} />
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Link>
              </Button>
            )}

            {/* Shopping Cart */}
            <CartSummaryNav />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0">
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
                      {/* <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group">
                          <span>Shop</span>
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="ml-3 pl-3 border-l-2 border-muted space-y-1">
                            {shopCategories.map((category: Category) => (
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
                      </Collapsible> */}

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

                      <Link
                        href="/blog"
                        className="flex items-center px-3 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        Insight
                      </Link>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {/* {isSearchOpen && (
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
        )} */}
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
