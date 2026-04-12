/** Represents a collection of schedules. */
export interface SchedulePreset {
  /** Unique identifier for the preset. */
  id: number;
  /** Display name of the preset. */
  name: string;
  /** Optional description of what this preset is for. */
  description: string | null;
  /** ISO 8601 timestamp of when the preset was created. */
  created_at: string;
  /** ISO 8601 timestamp of when the preset was last updated. */
  updated_at: string | null;
}

/** A schedule preset including its assigned active business days. */
export interface SchedulePresetWithDays extends SchedulePreset {
  /** Array of week days (1-7, where 1 is Monday and 7 is Sunday) this preset is active on. */
  business_days: number[];
}

/** Join table entry for presets and weekdays. */
export interface PresetBusinessDay {
  /** ID of the associated preset. */
  preset_id: number;
  /** ISO weekday index (1-7, 1=Monday). */
  weekday: number;
}

/** Represents a custom audio file used for schedule triggers. */
export interface CustomSound {
  /** Unique identifier for the sound. */
  id: number;
  /** User-friendly label for the sound. */
  label: string | null;
  /** Relative path to the sound file within the app data directory. */
  file_path: string;
  /** ISO 8601 timestamp of when the sound was added. */
  created_at: string;
  /** ISO 8601 timestamp of when the sound metadata was last updated. */
  updated_at: string | null;
}

/** Defines a specific time trigger within a preset. */
export interface Schedule {
  /** Unique identifier for the schedule. */
  id: number;
  /** Display label for the schedule. */
  label: string;
  /** Number of seconds from midnight UTC when this should trigger. */
  utc_trigger_time: number;
  /** Whether this specific schedule is currently enabled (1 for true, 0 for false). */
  is_active: number;
  /** ID of the custom sound to play, if any. */
  custom_sound_id: number | null;
  /** ID of the preset this schedule belongs to. */
  schedule_preset_id: number;
  /** The next calculated trigger time in ISO 8601 format. */
  next_trigger_at: string | null;
  /** Optional notes about the schedule. */
  description: string | null;
  /** ISO 8601 timestamp of creation. */
  created_at: string;
  /** ISO 8601 timestamp of last modification. */
  updated_at: string | null;
}

/** A schedule including the specific weekdays it is enabled for. */
export interface ScheduleWithWeekdays extends Schedule {
  /** Array of week days (0-6) this schedule triggers on. */
  weekdays: number[];
}

/** Join table entry for schedules and weekdays. */
export interface ScheduleWeekday {
  /** ID of the associated schedule. */
  schedule_id: number;
  /** Weekday index (0-6). */
  weekday: number;
}

/** Audit log entry for a schedule execution. */
export interface ScheduleTriggerLog {
  /** Unique identifier for the log entry. */
  id: number;
  /** ID of the schedule that was triggered. */
  schedule_id: number;
  /** ISO 8601 timestamp of the trigger event. */
  triggered_at: string;
  /** Whether the trigger was successful or encountered an error. */
  status: "success" | "failed";
  /** Error message if the trigger failed. */
  error_message: string | null;
}
