import { getDb } from "-/lib/db";
import { HelperQueryOptions } from "-/lib/helper-types";
import type { CustomSound } from "-/lib/models";
import { queryOptions } from "@tanstack/react-query";

/** Queries for retrieving custom sounds. */
export const soundsQueries = {
  /** Query key factory for sound data. */
  keys: {
    /** Root key for all sound queries. */
    all: ["sounds"] as const,
    /** Key for fetching the usage count of a specific sound. */
    scheduleCount: (id: number) => ["sounds", "scheduleCount", id] as const,
  },

  /**
   * Retrieves a list of all registered custom sounds.
   *
   * @param options - Query options.
   */
  list: (options?: HelperQueryOptions<CustomSound[]>) =>
    queryOptions({
      queryKey: soundsQueries.keys.all,
      queryFn: async () => {
        const db = await getDb();
        return (await db.select(
          "SELECT * FROM custom_sound ORDER BY label, file_path",
        )) as CustomSound[];
      },
      ...options,
    }),

  /**
   * Counts how many schedules are currently using a specific sound.
   *
   * @param id - The ID of the sound to check.
   * @param options - Query options.
   */
  scheduleCount: (id: number, options?: HelperQueryOptions<number>) =>
    queryOptions({
      queryKey: soundsQueries.keys.scheduleCount(id),
      queryFn: async () => {
        const db = await getDb();
        const [row] = (await db.select(
          "SELECT COUNT(*) as count FROM schedule WHERE custom_sound_id = $1",
          [id],
        )) as { count: number }[];
        return row.count;
      },
      ...options,
    }),
};
