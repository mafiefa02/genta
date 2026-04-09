import { getDb } from "-/lib/db";
import { IconLoader } from "@tabler/icons-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: Root,
  pendingComponent: RootLoading,
  errorComponent: RootError,
  pendingMs: 0,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/setup") return;
    const db = await getDb();
    const preset = (await db.select("SELECT * FROM schedule_preset")) as unknown[];
    if (preset.length === 0) {
      throw redirect({ to: "/setup" });
    }
  },
});

function Root() {
  return (
    <>
      <Outlet />
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
