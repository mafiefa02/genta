import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/schedules")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/schedules"!</div>;
}
