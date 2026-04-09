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
        <main className="content px-4 py-3">
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
