import { configQueries } from "-/hooks/queries/config";
import { presetsQueries } from "-/hooks/queries/presets";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_defaultLayout/presets")({
  component: RouteComponent,
  loader: ({ context }) => {
    return Promise.all([
      context.queryClient.ensureQueryData(presetsQueries.list()),
      context.queryClient.ensureQueryData(configQueries.activePresetId()),
    ]);
  },
});

function RouteComponent() {
  const { data: presets } = useSuspenseQuery(presetsQueries.list());
  const { data: activePresetId } = useSuspenseQuery(configQueries.activePresetId());

  return (
    <div>
      <h1>Presets</h1>
      <p>Active preset ID: {activePresetId}</p>
      <ul>
        {presets.map((preset) => (
          <li key={preset.id}>
            {preset.name} {preset.id === activePresetId && "(active)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
