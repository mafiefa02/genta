import { getDb } from "-/lib/db";
import { HelperMutationOptions } from "-/lib/helper-types";
import { copyToAppData, removeSoundFile } from "-/lib/sounds-fs";

interface CreateSoundInput {
  label: string;
  sourcePath: string;
}

interface UpdateSoundInput {
  id: number;
  label: string;
  newSourcePath?: string;
}

export const soundsMutations = {
  create: (options?: HelperMutationOptions<void, CreateSoundInput>) => ({
    mutationKey: ["sounds", "create"] as const,
    mutationFn: async ({ label, sourcePath }: CreateSoundInput) => {
      const relativePath = await copyToAppData(sourcePath);
      const db = await getDb();
      await db.execute("INSERT INTO custom_sound (label, file_path) VALUES ($1, $2)", [
        label,
        relativePath,
      ]);
    },
    ...options,
  }),

  update: (options?: HelperMutationOptions<void, UpdateSoundInput>) => ({
    mutationKey: ["sounds", "update"] as const,
    mutationFn: async ({ id, label, newSourcePath }: UpdateSoundInput) => {
      const db = await getDb();
      if (newSourcePath) {
        const [old] = (await db.select("SELECT file_path FROM custom_sound WHERE id = $1", [
          id,
        ])) as { file_path: string }[];

        const relativePath = await copyToAppData(newSourcePath);

        await db.execute(
          "UPDATE custom_sound SET label = $1, file_path = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [label, relativePath, id],
        );

        if (old?.file_path) {
          await removeSoundFile(old.file_path);
        }
      } else {
        await db.execute(
          "UPDATE custom_sound SET label = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [label, id],
        );
      }
    },
    ...options,
  }),

  delete: (options?: HelperMutationOptions<void, { id: number; filePath: string }>) => ({
    mutationKey: ["sounds", "delete"] as const,
    mutationFn: async ({ id, filePath }: { id: number; filePath: string }) => {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      try {
        await db.execute("UPDATE schedule SET custom_sound_id = NULL WHERE custom_sound_id = $1", [
          id,
        ]);
        await db.execute("DELETE FROM custom_sound WHERE id = $1", [id]);
        await db.execute("COMMIT");
      } catch (e) {
        await db.execute("ROLLBACK");
        throw e;
      }
      await removeSoundFile(filePath);
    },
    ...options,
  }),
};
