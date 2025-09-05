"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface CardHeroProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: {
    label: string;
    href: string;
  };
  backgroundColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function CardHero({
  title,
  subtitle,
  className,
  action,
  backgroundColor = "bg-red-500",
  textColor = "text-white",
  icon,
  children,
}: CardHeroProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-8 overflow-hidden",
        backgroundColor,
        textColor,
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">{title}</h2>
        {subtitle && (
          <p className="text-lg opacity-80">{subtitle}</p>
        )}
        {children}
        {action && (
          <div className="mt-4">
            <Button
              asChild
              variant="secondary"
              className="rounded-full bg-white hover:bg-white/90 text-black"
            >
              <Link href={action.href}>
                {action.label}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
      {icon && (
        <div className="absolute bottom-4 right-4">
          {icon}
        </div>
      )}
    </div>
  );
}