import { getDb } from "-/lib/db";
import { HelperMutationOptions } from "-/lib/helper-types";

/** Input parameters for creating a new schedule. */
interface CreateScheduleInput {
  /** Display label for the schedule. */
  label: string;
  /** Optional detailed description. */
  description?: string;
  /** Time of day to trigger, in seconds from midnight UTC. */
  utcTriggerTime: number;
  /** ID of the preset this schedule belongs to. */
  presetId: number;
  /** Array of ISO week days (1-7, 1=Monday) when this schedule is active. */
  weekdays: number[];
  /** Optional ID of a custom sound to play at trigger time. */
  customSoundId?: number | null;
}

/** Input parameters for updating an existing schedule. */
interface UpdateScheduleInput {
  /** ID of the schedule to update. */
  id: number;
  /** New display label. */
  label: string;
  /** Updated description. */
  description?: string;
  /** Updated trigger time in seconds from midnight UTC. */
  utcTriggerTime: number;
  /** Updated array of ISO week days (1-7, 1=Monday). */
  weekdays: number[];
  /** Updated custom sound ID. */
  customSoundId?: number | null;
}

/**
 * Helper to batch insert active weekdays for a schedule.
 *
 * @param db - The active database connection.
 * @param scheduleId - The ID of the schedule.
 * @param weekdays - Array of ISO weekdays (1-7).
 */
async function insertScheduleWeekdays(
  db: Awaited<ReturnType<typeof getDb>>,
  scheduleId: number,
  weekdays: number[],
) {
  for (const day of weekdays) {
    await db.execute("INSERT INTO schedule_weekday (schedule_id, weekday) VALUES ($1, $2)", [
      scheduleId,
      day,
    ]);
  }
}

/** Mutations for managing individual schedules. */
export const schedulesMutations = {
  /**
   * Creates a new schedule within a preset.
   *
   * @param options - Mutation options.
   */
  create: (options?: HelperMutationOptions<void, CreateScheduleInput>) => ({
    mutationKey: ["schedules", "create"] as const,
    mutationFn: async ({
      label,
      description,
      utcTriggerTime,
      presetId,
      weekdays,
      customSoundId,
    }: CreateScheduleInput) => {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      try {
        const result = (await db.execute(
          "INSERT INTO schedule (label, description, utc_trigger_time, schedule_preset_id, custom_sound_id) VALUES ($1, $2, $3, $4, $5)",
          [label, description ?? null, utcTriggerTime, presetId, customSoundId ?? null],
        )) as { lastInsertId: number };

        await insertScheduleWeekdays(db, result.lastInsertId, weekdays);
        await db.execute("COMMIT");
      } catch (e) {
        await db.execute("ROLLBACK");
        throw e;
      }
    },
    ...options,
  }),

  /**
   * Updates an existing schedule's configuration and active days.
   *
   * @param options - Mutation options.
   */
  update: (options?: HelperMutationOptions<void, UpdateScheduleInput>) => ({
    mutationKey: ["schedules", "update"] as const,
    mutationFn: async ({
      id,
      label,
      description,
      utcTriggerTime,
      weekdays,
      customSoundId,
    }: UpdateScheduleInput) => {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      try {
        await db.execute(
          "UPDATE schedule SET label = $1, description = $2, utc_trigger_time = $3, custom_sound_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
          [label, description ?? null, utcTriggerTime, customSoundId ?? null, id],
        );

        await db.execute("DELETE FROM schedule_weekday WHERE schedule_id = $1", [id]);
        await insertScheduleWeekdays(db, id, weekdays);
        await db.execute("COMMIT");
      } catch (e) {
        await db.execute("ROLLBACK");
        throw e;
      }
    },
    ...options,
  }),

  /**
   * Deletes a schedule from the database.
   *
   * @param options - Mutation options.
   */
  delete: (options?: HelperMutationOptions<void, number>) => ({
    mutationKey: ["schedules", "delete"] as const,
    mutationFn: async (id: number) => {
      const db = await getDb();
      await db.execute("DELETE FROM schedule WHERE id = $1", [id]);
    },
    ...options,
  }),

  /**
   * Toggles whether a schedule is currently active (enabled).
   *
   * @param options - Mutation options.
   */
  toggleActive: (options?: HelperMutationOptions<void, { id: number; isActive: boolean }>) => ({
    mutationKey: ["schedules", "toggleActive"] as const,
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const db = await getDb();
      await db.execute(
        "UPDATE schedule SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [isActive ? 1 : 0, id],
      );
    },
    ...options,
  }),
};
