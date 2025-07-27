import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { BreadcrumbNav } from "@/components/shared/sidebar/breadcrumb-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
//   const session = await auth.api.getSession({
//     headers: await headers(), // you need to pass the headers object.
//   });

//   if (!session) {
//     redirect("/login");
//   }

//   if (session.user.role !== "admin") {
//     redirect("/");
//   }

  return (
    <SidebarProvider>
      <AppSidebar collapsible="icon" />
      <main className="flex-1 w-full">
        <div className="flex flex-col min-h-screen">
          <div className="flex items-center p-1 border-b bg-card">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNav activeTenat={"admin"} />
          </div>
          <div className="flex-1 flex justify-center px-4">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
