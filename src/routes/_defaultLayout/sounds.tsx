import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/sounds")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/sounds"!</div>;
}
