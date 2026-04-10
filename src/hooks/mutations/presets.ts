import { setConfig } from "-/lib/config-store";
import { getDb } from "-/lib/db";
import { HelperMutationOptions } from "-/lib/helper-types";

export const DEFAULT_BUSINESS_DAYS = [1, 2, 3, 4, 5];

interface CreatePresetInput {
  name: string;
  description?: string;
  businessDays?: number[];
}

interface UpdatePresetInput {
  id: number;
  name: string;
  description?: string;
  businessDays?: number[];
}

async function insertBusinessDays(
  db: Awaited<ReturnType<typeof getDb>>,
  presetId: number,
  days: number[],
) {
  for (const day of days) {
    await db.execute("INSERT INTO preset_business_day (preset_id, weekday) VALUES ($1, $2)", [
      presetId,
      day,
    ]);
  }
}

export const presetsMutations = {
  create: (options?: HelperMutationOptions<void, CreatePresetInput>) => ({
    mutationKey: ["presets", "create"] as const,
    mutationFn: async ({
      name,
      description,
      businessDays = DEFAULT_BUSINESS_DAYS,
    }: CreatePresetInput) => {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      try {
        const result = (await db.execute(
          "INSERT INTO schedule_preset (name, description) VALUES ($1, $2)",
          [name, description ?? null],
        )) as { lastInsertId: number };

        await insertBusinessDays(db, result.lastInsertId, businessDays);
        await db.execute("COMMIT");
        await setConfig("activePresetId", result.lastInsertId);
      } catch (e) {
        await db.execute("ROLLBACK");
        throw e;
      }
    },
    ...options,
  }),

  update: (options?: HelperMutationOptions<void, UpdatePresetInput>) => ({
    mutationKey: ["presets", "update"] as const,
    mutationFn: async ({ id, name, description, businessDays }: UpdatePresetInput) => {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      try {
        await db.execute(
          "UPDATE schedule_preset SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [name, description ?? null, id],
        );

        if (businessDays !== undefined) {
          await db.execute("DELETE FROM preset_business_day WHERE preset_id = $1", [id]);
          await insertBusinessDays(db, id, businessDays);
        }

        await db.execute("COMMIT");
      } catch (e) {
        await db.execute("ROLLBACK");
        throw e;
      }
    },
    ...options,
  }),

  delete: (options?: HelperMutationOptions<void, number>) => ({
    mutationKey: ["presets", "delete"] as const,
    mutationFn: async (id: number) => {
      const db = await getDb();
      const [row] = (await db.select(
        "SELECT COUNT(*) as count FROM schedule WHERE schedule_preset_id = $1",
        [id],
      )) as { count: number }[];
      if (row.count > 0) {
        throw new Error(`Preset ini memiliki ${row.count} jadwal terkait dan tidak bisa dihapus.`);
      }
      await db.execute("DELETE FROM schedule_preset WHERE id = $1", [id]);
    },
    ...options,
  }),

  activate: (options?: HelperMutationOptions<void, number>) => ({
    mutationKey: ["presets", "activate"] as const,
    mutationFn: async (id: number) => {
      await setConfig("activePresetId", id);
    },
    ...options,
  }),
};
