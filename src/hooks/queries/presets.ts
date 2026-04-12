import type { SchedulePreset, SchedulePresetWithDays } from "-/lib/models";

import { getDb } from "-/lib/db";
import { HelperQueryOptions } from "-/lib/helper-types";
import { queryOptions } from "@tanstack/react-query";

/** Database row structure for a schedule preset joined with its business days. */
type PresetRow = SchedulePreset & {
  /** Comma-separated list of ISO weekdays (1-7). */
  business_days_csv: string | null;
};

/**
 * Transforms a raw database row into a structured SchedulePresetWithDays object.
 * Parses the comma-separated business days and sorts them.
 *
 * @param row - The raw database row.
 * @returns A formatted preset object.
 */
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

/** SQL query template for fetching presets with their associated business days. */
const PRESET_WITH_DAYS_SQL = `
  SELECT sp.*, GROUP_CONCAT(pbd.weekday) as business_days_csv
  FROM schedule_preset sp
  LEFT JOIN preset_business_day pbd ON pbd.preset_id = sp.id
`;

/** Queries for retrieving schedule presets. */
export const presetsQueries = {
  /** Query key factory for preset data. */
  keys: {
    /** Root key for all preset queries. */
    all: ["presets"] as const,
    /** Key for a specific preset's details. */
    detail: (id: number) => ["presets", id] as const,
  },

  /**
   * Retrieves a list of all presets including their active business days.
   *
   * @param options - Query options.
   */
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

  /**
   * Retrieves a single preset by its ID.
   *
   * @param id - The ID of the preset to fetch.
   * @param options - Query options.
   */
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
