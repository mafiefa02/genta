import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("config.json");

/** All known config keys and their value types. */
interface ConfigSchema {
  activePresetId: number;
}

export async function getConfig<K extends keyof ConfigSchema>(
  key: K,
): Promise<ConfigSchema[K] | null> {
  const value = await store.get<ConfigSchema[K]>(key);
  return value ?? null;
}

export async function setConfig<K extends keyof ConfigSchema>(
  key: K,
  value: ConfigSchema[K],
): Promise<void> {
  await store.set(key, value);
  await store.save();
}
