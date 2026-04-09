import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/profiles")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/profiles"!</div>;
}
