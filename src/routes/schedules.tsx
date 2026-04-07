import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/schedules")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/schedules"!</div>;
}
