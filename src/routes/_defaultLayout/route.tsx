import { AppHeader } from "-/components/app-header";
import { AppSidebar } from "-/components/app-sidebar";
import { SidebarProvider } from "-/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-dvh">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="content px-4 pb-3">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
