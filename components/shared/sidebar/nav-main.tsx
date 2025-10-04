
"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BarChart3, Folder, LayoutDashboard, List, Users } from "lucide-react";
import { PiArticleNyTimesDuotone } from "react-icons/pi";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { IoIosLink } from "react-icons/io";
import { FaMoneyCheckAlt } from "react-icons/fa";

// Direct icon mapping
const iconComponents: Record<string, React.ComponentType> = {
  "LayoutDashboard": LayoutDashboard,
  "List": List,
  "BarChart3": BarChart3,
  "Folder": Folder,
  "Users": Users,
  "FaMoneyCheckAlt": FaMoneyCheckAlt,
  "PiArticleNyTimesDuotone": PiArticleNyTimesDuotone,
  "IoIosLink": IoIosLink,
};

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url;
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = iconComponents[iconName];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in icon mapping`);
      return null;
    }
    // Create element with proper React component
    return React.createElement(IconComponent);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              onClick={() => router.push(item.url)}
              key={item.title}
            >
              <SidebarMenuButton
                className={`${isActive(item.url) && "bg-primary/10 text-primary font-medium cursor-pointer"} cursor-pointer`}
                tooltip={item.title}
              >
                {item.icon && renderIcon(item.icon)}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
