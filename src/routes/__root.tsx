import type { QueryClient } from "@tanstack/react-query";

import { getConfig } from "-/lib/config-store";
import { getDb } from "-/lib/db";
import { IconLoader } from "@tabler/icons-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Root,
  pendingComponent: RootLoading,
  errorComponent: RootError,
  pendingMs: 0,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/setup") return;

    const db = await getDb();
    const [result] = (await db.select("SELECT COUNT(*) as count FROM schedule_preset")) as {
      count: number;
    }[];

    // No presets at all: must create one
    if (result.count === 0) {
      throw redirect({ to: "/setup" });
    }

    // Presets exist: verify there's a valid active preset in config
    const activePresetId = await getConfig("activePresetId");
    if (activePresetId == null) {
      throw redirect({ to: "/setup" });
    }

    const [match] = (await db.select("SELECT id FROM schedule_preset WHERE id = $1", [
      activePresetId,
    ])) as { id: number }[];
    if (!match) {
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
