import type { SchedulePreset, SchedulePresetWithDays } from "-/lib/models";

import { getDb } from "-/lib/db";
import { HelperQueryOptions } from "-/lib/helper-types";
import { queryOptions } from "@tanstack/react-query";

type PresetRow = SchedulePreset & { business_days_csv: string | null };

function parsePresetRow(row: PresetRow): SchedulePresetWithDays {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    business_days: row.business_days_csv ? row.business_days_csv.split(",").map(Number).sort() : [],
  };
}

const PRESET_WITH_DAYS_SQL = `
  SELECT sp.*, GROUP_CONCAT(pbd.weekday) as business_days_csv
  FROM schedule_preset sp
  LEFT JOIN preset_business_day pbd ON pbd.preset_id = sp.id
`;

export const presetsQueries = {
  keys: {
    all: ["presets"] as const,
    detail: (id: number) => ["presets", id] as const,
  },

  list: (options?: HelperQueryOptions<SchedulePresetWithDays[]>) =>
    queryOptions({
      queryKey: presetsQueries.keys.all,
      queryFn: async () => {
        const db = await getDb();
        const rows = (await db.select(`${PRESET_WITH_DAYS_SQL} GROUP BY sp.id`)) as PresetRow[];
        return rows.map(parsePresetRow);
      },
      ...options,
    }),

  byId: (id: number, options?: HelperQueryOptions<SchedulePresetWithDays | null>) =>
    queryOptions({
      queryKey: presetsQueries.keys.detail(id),
      queryFn: async () => {
        const db = await getDb();
        const [row] = (await db.select(`${PRESET_WITH_DAYS_SQL} WHERE sp.id = $1 GROUP BY sp.id`, [
          id,
        ])) as PresetRow[];
        return row ? parsePresetRow(row) : null;
      },
      ...options,
    }),
};
