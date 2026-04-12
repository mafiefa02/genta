import { setConfig } from "-/lib/config-store";
import { getDb } from "-/lib/db";
import { HelperMutationOptions } from "-/lib/helper-types";

/** Default business days (Monday to Friday) using ISO weekday indexing (1-7). */
export const DEFAULT_BUSINESS_DAYS = [1, 2, 3, 4, 5];

/** Input parameters for creating a new schedule preset. */
interface CreatePresetInput {
  /** Name of the preset. */
  name: string;
  /** Optional description for the preset. */
  description?: string;
  /** Optional list of active business days (1-7, 1=Monday). Defaults to Mon-Fri. */
  businessDays?: number[];
}

/** Input parameters for updating an existing schedule preset. */
interface UpdatePresetInput {
  /** ID of the preset to update. */
  id: number;
  /** New name for the preset. */
  name: string;
  /** Updated description for the preset. */
  description?: string;
  /** Updated list of active business days (1-7, 1=Monday). */
  businessDays?: number[];
}

/**
 * Helper to batch insert business days for a preset.
 *
 * @param db - The active database connection.
 * @param presetId - The ID of the preset.
 * @param days - Array of ISO weekdays (1-7).
 */
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

/** Mutations for managing schedule presets. */
export const presetsMutations = {
  /**
   * Creates a new preset and sets it as the active one.
   *
   * @param options - Mutation options.
   */
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

  /**
   * Updates an existing preset's metadata and business days.
   *
   * @param options - Mutation options.
   */
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

  /**
   * Deletes a preset if it has no associated schedules.
   *
   * @param options - Mutation options.
   */
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

  /**
   * Sets a specific preset as the active one in the app config.
   *
   * @param options - Mutation options.
   */
  activate: (options?: HelperMutationOptions<void, number>) => ({
    mutationKey: ["presets", "activate"] as const,
    mutationFn: async (id: number) => {
      await setConfig("activePresetId", id);
    },
    ...options,
  }),
};
