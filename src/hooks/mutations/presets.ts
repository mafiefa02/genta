import { setConfig } from "-/lib/config-store";
import { getDb } from "-/lib/db";
import type { UseMutationOptions } from "@tanstack/react-query";

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationKey" | "mutationFn"
>;

export const presetsMutations = {
  create: (options?: MutationOptions<void, string>) => ({
    mutationKey: ["presets", "create"] as const,
    mutationFn: async (name: string) => {
      const db = await getDb();
      const result = (await db.execute("INSERT INTO schedule_preset (name) VALUES ($1)", [
        name,
      ])) as { lastInsertId: number };
      await setConfig("activePresetId", result.lastInsertId);
    },
    ...options,
  }),

  activate: (options?: MutationOptions<void, number>) => ({
    mutationKey: ["presets", "activate"] as const,
    mutationFn: async (id: number) => {
      await setConfig("activePresetId", id);
    },
    ...options,
  }),
};
