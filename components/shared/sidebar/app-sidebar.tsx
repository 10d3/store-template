"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export function AppSidebar({
  sidebarData,
  ...props
}: React.ComponentProps<typeof Sidebar> & { sidebarData: { navMain: { title: string; url: string; icon?: string; items?: { title: string; url: string }[] }[] } }) {
  const session = useSession();
  const user = {
    name: session.data?.user.name as string,
    email: session.data?.user.email as string,
    avatar: session.data?.user.image as string,
  };
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="#" className="">
                <Image
                  src="/favicon.png"
                  width={1000}
                  height={1000}
                  alt={""}
                  className="!size-8"
                />
                <span className="text-base font-semibold">{`Vitanou`}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain.map(item => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
          items: item.items
        }))} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
