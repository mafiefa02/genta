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
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="content flex-1 overflow-y-auto bg-linear-to-b from-background via-background to-primary/5 px-4 py-3">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
