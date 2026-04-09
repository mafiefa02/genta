import type { SchedulePreset } from "-/lib/models";

import { getDb } from "-/lib/db";
import { queryOptions, type QueryObserverOptions } from "@tanstack/react-query";

type QueryOptions<TData> = Omit<QueryObserverOptions<TData>, "queryKey" | "queryFn">;

export const presetsQueries = {
  keys: {
    all: ["presets"] as const,
    detail: (id: number) => ["presets", id] as const,
  },

  list: (options?: QueryOptions<SchedulePreset[]>) =>
    queryOptions({
      queryKey: presetsQueries.keys.all,
      queryFn: async () => {
        const db = await getDb();
        return (await db.select("SELECT * FROM schedule_preset")) as SchedulePreset[];
      },
      ...options,
    }),

  byId: (id: number, options?: QueryOptions<SchedulePreset | null>) =>
    queryOptions({
      queryKey: presetsQueries.keys.detail(id),
      queryFn: async () => {
        const db = await getDb();
        const [row] = (await db.select("SELECT * FROM schedule_preset WHERE id = $1", [
          id,
        ])) as SchedulePreset[];
        return row ?? null;
      },
      ...options,
    }),
};
