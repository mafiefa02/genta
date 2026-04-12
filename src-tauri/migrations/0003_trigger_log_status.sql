ALTER TABLE schedule_trigger_log ADD COLUMN status TEXT NOT NULL DEFAULT 'success';
ALTER TABLE schedule_trigger_log ADD COLUMN error_message TEXT;
