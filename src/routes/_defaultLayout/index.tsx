import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/")({
  beforeLoad: () => {
    throw redirect({ to: "/schedules" });
  },
});
