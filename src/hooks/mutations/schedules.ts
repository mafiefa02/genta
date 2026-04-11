import { getDb } from "-/lib/db";
import { HelperMutationOptions } from "-/lib/helper-types";

interface CreateScheduleInput {
  label: string;
  description?: string;
  utcTriggerTime: number;
  presetId: number;
  weekdays: number[];
  customSoundId?: number | null;
}

interface UpdateScheduleInput {
  id: number;
  label: string;
  description?: string;
  utcTriggerTime: number;
  weekdays: number[];
  customSoundId?: number | null;
}

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

export const schedulesMutations = {
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

  delete: (options?: HelperMutationOptions<void, number>) => ({
    mutationKey: ["schedules", "delete"] as const,
    mutationFn: async (id: number) => {
      const db = await getDb();
      await db.execute("DELETE FROM schedule WHERE id = $1", [id]);
    },
    ...options,
  }),

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
