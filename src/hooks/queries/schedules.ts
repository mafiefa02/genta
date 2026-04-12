import type { Schedule, ScheduleWithWeekdays } from "-/lib/models";

import { getDb } from "-/lib/db";
import { HelperQueryOptions } from "-/lib/helper-types";
import { queryOptions } from "@tanstack/react-query";

/** Database row structure for a schedule joined with its enabled weekdays. */
type ScheduleRow = Schedule & { weekdays_csv: string | null };

/**
 * Transforms a raw database row into a structured ScheduleWithWeekdays object.
 * Parses the comma-separated enabled weekdays and sorts them.
 * 
 * @param row - The raw database row.
 * @returns A formatted schedule object.
 */
function parseScheduleRow(row: ScheduleRow): ScheduleWithWeekdays {
  return {
    id: row.id,
    label: row.label,
    utc_trigger_time: row.utc_trigger_time,
    is_active: row.is_active,
    custom_sound_id: row.custom_sound_id,
    schedule_preset_id: row.schedule_preset_id,
    next_trigger_at: row.next_trigger_at,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    weekdays: row.weekdays_csv ? row.weekdays_csv.split(",").map(Number).sort() : [],
  };
}

/** SQL query template for fetching schedules with their associated weekdays. */
const SCHEDULE_WITH_WEEKDAYS_SQL = `
  SELECT s.*, GROUP_CONCAT(sw.weekday) as weekdays_csv
  FROM schedule s
  LEFT JOIN schedule_weekday sw ON sw.schedule_id = s.id
`;

/** Queries for retrieving schedules. */
export const schedulesQueries = {
  /** Query key factory for schedule data. */
  keys: {
    /** Root key for all schedule queries. */
    all: ["schedules"] as const,
    /** Key for all schedules belonging to a specific preset. */
    byPreset: (presetId: number) => ["schedules", "preset", presetId] as const,
  },

  /**
   * Retrieves all schedules associated with a specific preset.
   * 
   * @param presetId - The ID of the parent preset.
   * @param options - Query options.
   */
  byPreset: (presetId: number, options?: HelperQueryOptions<ScheduleWithWeekdays[]>) =>
    queryOptions({
      queryKey: schedulesQueries.keys.byPreset(presetId),
      queryFn: async () => {
        const db = await getDb();
        const rows = (await db.select(
          `${SCHEDULE_WITH_WEEKDAYS_SQL} WHERE s.schedule_preset_id = $1 GROUP BY s.id ORDER BY s.utc_trigger_time`,
          [presetId],
        )) as ScheduleRow[];
        return rows.map(parseScheduleRow);
      },
      ...options,
    }),
};
