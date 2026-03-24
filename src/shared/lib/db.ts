import { appDataDir } from "@tauri-apps/api/path";
import Database from "@tauri-apps/plugin-sql";
import { Kysely } from "kysely";
import type { ColumnType } from "kysely";
import { TauriSqliteDialect } from "kysely-dialect-tauri";

// Helper type for columns that are auto-generated (AutoIncrement or Default values)
type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export interface Profiles {
  id: Generated<number>;
  name: string;
  timezone: string;
  business_days: Generated<string>; // JSON array of ISO day numbers, e.g. '[1,2,3,4,5]'
}

export interface Extensions {
  id: Generated<number>;
  name: string;
  data_url: string;
}

export interface ProfileExtensions {
  id: Generated<number>;
  profile_id: number;
  extension_id: number;
  settings: string | null; // stored as JSON string
  is_enabled: Generated<number>; // 0 or 1
  created_at: Generated<string>; // Stored as TEXT (ISO8601)
  updated_at: string | null;
}

export interface Schedules {
  id: Generated<number>;
  profile_id: number;
  sound_id: number | null;
  name: string;
  time: number; // Minutes from midnight
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  repeat: Generated<"once" | "weekly">;
  is_active: Generated<number>; // 0 or 1
  created_at: Generated<string>;
  updated_at: string | null;
}

export interface ScheduleDays {
  schedule_id: number;
  day_of_week: number; // 1-7
}

export interface ScheduleOverrides {
  schedule_id: number;
  original_date: string; // YYYY-MM-DD
  new_name: string | null;
  new_sound_id: number | null;
  new_date: string | null; // YYYY-MM-DD
  new_time: number | null; // Minutes from midnight
  is_cancelled: Generated<number>; // 0 or 1
  created_at: Generated<string>;
  updated_at: string | null;
}

export interface Sounds {
  id: Generated<number>;
  name: string;
  file_name: string;
}

export interface DatabaseTables {
  profiles: Profiles;
  extensions: Extensions;
  profile_extensions: ProfileExtensions;
  sounds: Sounds;
  schedules: Schedules;
  schedule_days: ScheduleDays;
  schedule_overrides: ScheduleOverrides;
}

export const db = new Kysely<DatabaseTables>({
  dialect: new TauriSqliteDialect({
    database: async (prefix) =>
      Database.load(`${prefix}${await appDataDir()}/kron.db`),
  }),
});
