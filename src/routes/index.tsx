import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <div className="flex flex-1 flex-col">
      <p>Hello!</p>
    </div>
  );
}
