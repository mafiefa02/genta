import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profiles")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/profiles"!</div>;
}
