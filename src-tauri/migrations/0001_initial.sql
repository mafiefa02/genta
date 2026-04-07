CREATE TABLE schedule_preset (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE custom_sound (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT,
  file_path TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  utc_trigger_time INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  custom_sound_id INTEGER REFERENCES custom_sound (id),
  schedule_preset_id INTEGER NOT NULL REFERENCES schedule_preset (id),
  next_trigger_at DATETIME,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE schedule_weekday (
  schedule_id INTEGER NOT NULL REFERENCES schedule (id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  PRIMARY KEY (schedule_id, weekday)
);

CREATE TABLE schedule_trigger_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL REFERENCES schedule (id),
  triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_active_next_trigger ON schedule (is_active, next_trigger_at);

CREATE INDEX idx_schedule_weekday_weekday ON schedule_weekday (weekday);

CREATE INDEX idx_schedule_trigger_log_schedule_id ON schedule_trigger_log (schedule_id);
