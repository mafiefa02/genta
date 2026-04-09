import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
const DB = "sqlite:genta.db";

/**  */
export async function getDb() {
  return db ?? (await Database.load(DB));
}
