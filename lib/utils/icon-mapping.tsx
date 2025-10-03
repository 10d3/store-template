import { BarChart3, Folder, LayoutDashboard, List, Users } from "lucide-react";
import { FcMoneyTransfer } from "react-icons/fc";
import { PiArticleNyTimesDuotone } from "react-icons/pi";
import { IoIosLink } from "react-icons/io";
import React from "react";

// Icon mapping object that maps string identifiers to their respective components
export const iconMapping: Record<string, React.ComponentType> = {
  LayoutDashboard,
  List,
  BarChart3,
  Folder,
  Users,
  FcMoneyTransfer,
  PiArticleNyTimesDuotone,
  IoIosLink
};

// Helper function to render an icon based on its string identifier
export function renderIcon(iconName: string) {
  const IconComponent = iconMapping[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in icon mapping`);
    return null;
  }

  return <IconComponent />;
}
