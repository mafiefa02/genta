import { AppSidebar } from "-/components/app-sidebar";
import { SidebarProvider } from "-/components/ui/sidebar";
import { IconLoader } from "@tabler/icons-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: Root,
  pendingComponent: RootLoading,
  errorComponent: RootError,
});

function Root() {
  return (
    <>
      <div className="flex h-dvh">
        <SidebarProvider>
          <AppSidebar />
          <main className="content px-4 py-3">
            <Outlet />
          </main>
        </SidebarProvider>
      </div>
      <TanStackDevtools
        config={{ position: "bottom-right", hideUntilHover: true }}
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

function RootLoading() {
  return (
    <main className="flex h-dvh w-dvw items-center justify-center">
      <IconLoader className="animate-spin" />
    </main>
  );
}

function RootError() {
  return (
    <main className="flex h-dvh w-dvw items-center justify-center">
      <p className="text-lg">Error! Something went wrong</p>
    </main>
  );
}
