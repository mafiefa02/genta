-- Recreate schedule_trigger_log with ON DELETE SET NULL on schedule_id.
-- SQLite does not support ALTER CONSTRAINT, so we rebuild the table.

CREATE TABLE schedule_trigger_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER REFERENCES schedule (id) ON DELETE SET NULL,
  triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT
);

INSERT INTO schedule_trigger_log_new (id, schedule_id, triggered_at, status, error_message)
SELECT id, schedule_id, triggered_at, status, error_message FROM schedule_trigger_log;

DROP TABLE schedule_trigger_log;

ALTER TABLE schedule_trigger_log_new RENAME TO schedule_trigger_log;

CREATE INDEX idx_schedule_trigger_log_schedule_id ON schedule_trigger_log (schedule_id);
