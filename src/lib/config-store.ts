import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("config.json");

/** All known config keys and their value types. */
interface ConfigSchema {
  activePresetId: number;
}

/**
 * Retrieves a value from the configuration store.
 *
 * @template K - The configuration key type.
 * @param key - The key to retrieve from the store.
 * @returns A promise that resolves to the configuration value or null if not found.
 */
export async function getConfig<K extends keyof ConfigSchema>(
  key: K,
): Promise<ConfigSchema[K] | null> {
  const value = await store.get<ConfigSchema[K]>(key);
  return value ?? null;
}

/**
 * Updates or sets a value in the configuration store.
 *
 * @template K - The configuration key type.
 * @param key - The key to set in the store.
 * @param value - The value to associate with the key.
 * @returns A promise that resolves when the configuration has been saved.
 */
export async function setConfig<K extends keyof ConfigSchema>(
  key: K,
  value: ConfigSchema[K],
): Promise<void> {
  await store.set(key, value);
  await store.save();
}
