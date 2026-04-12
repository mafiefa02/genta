export interface SchedulePreset {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SchedulePresetWithDays extends SchedulePreset {
  business_days: number[];
}

export interface PresetBusinessDay {
  preset_id: number;
  weekday: number;
}

export interface CustomSound {
  id: number;
  label: string | null;
  file_path: string;
  created_at: string;
  updated_at: string | null;
}

export interface Schedule {
  id: number;
  label: string;
  utc_trigger_time: number;
  is_active: number;
  custom_sound_id: number | null;
  schedule_preset_id: number;
  next_trigger_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ScheduleWithWeekdays extends Schedule {
  weekdays: number[];
}

export interface ScheduleWeekday {
  schedule_id: number;
  weekday: number;
}

export interface ScheduleTriggerLog {
  id: number;
  schedule_id: number;
  triggered_at: string;
  status: "success" | "failed";
  error_message: string | null;
}
