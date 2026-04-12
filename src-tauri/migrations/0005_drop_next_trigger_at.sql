-- Drop the index that depends on the next_trigger_at column.
DROP INDEX IF EXISTS idx_schedule_active_next_trigger;

-- Drop the next_trigger_at column from the schedule table.
ALTER TABLE schedule DROP COLUMN next_trigger_at;

-- Create a new index to optimize scheduler queries which filter by preset, activity, and trigger time.
CREATE INDEX idx_schedule_active_preset_time ON schedule (schedule_preset_id, is_active, utc_trigger_time);
