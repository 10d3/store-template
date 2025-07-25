import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { BreadcrumbNav } from "@/components/shared/sidebar/breadcrumb-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="floating" />
      <main className="flex-1 w-full">
        <div className="flex flex-col min-h-screen">
          <div className="flex items-center p-1 border-b">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNav activeTenat={"admin"} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
