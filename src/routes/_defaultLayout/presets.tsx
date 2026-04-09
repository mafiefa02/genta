import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/presets")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/profiles"!</div>;
}
