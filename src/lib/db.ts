import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
const DB = "sqlite:genta.db";

/**
 * Loads and returns the application's SQLite database instance.
 * Lazily initializes the connection if it hasn't been established.
 *
 * @returns A promise that resolves to the database instance.
 */
export async function getDb() {
  return db ?? (await Database.load(DB));
}
