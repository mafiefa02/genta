CREATE TABLE preset_business_day (
  preset_id INTEGER NOT NULL REFERENCES schedule_preset (id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  PRIMARY KEY (preset_id, weekday)
);

CREATE INDEX idx_preset_business_day_preset_id ON preset_business_day (preset_id);

-- Seed existing presets with Mon-Fri (ISO weekdays 1-5)
INSERT INTO preset_business_day (preset_id, weekday)
SELECT id, value FROM schedule_preset,
  (SELECT 1 AS value UNION ALL SELECT 2 UNION ALL SELECT 3
   UNION ALL SELECT 4 UNION ALL SELECT 5);
