use std::fs::File;
use std::io::BufReader;
use std::num::NonZero;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{FromRow, SqlitePool};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

#[derive(FromRow)]
struct TriggeredSchedule {
    id: i64,
    #[allow(dead_code)]
    label: String,
    #[allow(dead_code)]
    custom_sound_id: Option<i64>,
    sound_file_path: Option<String>,
}

fn get_active_preset_id(app: &AppHandle) -> Option<i64> {
    let store = app.store("config.json").ok()?;
    store.get("activePresetId").and_then(|v| v.as_i64())
}

fn play_sound(sink_handle: &MixerDeviceSink, path: &PathBuf) -> Result<(), String> {
    let file = File::open(path).map_err(|e| format!("Failed to open audio file: {e}"))?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader).map_err(|e| format!("Failed to decode audio file: {e}"))?;
    sink_handle.mixer().add(source);
    Ok(())
}

async fn log_trigger(
    pool: &SqlitePool,
    schedule_id: i64,
    status: &str,
    error_message: Option<&str>,
) {
    let _ = sqlx::query(
        "INSERT INTO schedule_trigger_log (schedule_id, status, error_message) VALUES (?1, ?2, ?3)",
    )
    .bind(schedule_id)
    .bind(status)
    .bind(error_message)
    .execute(pool)
    .await;
}

pub async fn start(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let db_path = app_data_dir.join("genta.db");
    let default_bell_path = app
        .path()
        .resolve("default_bell.mp3", BaseDirectory::Resource)?;

    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&format!("sqlite:{}?mode=rwc", db_path.display()))
        .await?;

    let sink_handle: MixerDeviceSink = DeviceSinkBuilder::from_default_device()
        .map_err(|e| format!("Failed to get default audio device: {e}"))?
        .with_sample_rate(NonZero::new(44100).unwrap())
        // Try with 44.1 kHz first, and if it fails, it will fall back to a configuration the hardware explicitly supports
        .open_sink_or_fallback()
        .map_err(|e| format!("Failed to open audio output: {e}"))?;

    loop {
        // Sleep until the top of the next minute, synced to device clock
        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        let ms_into_minute = now_ms % 60_000;
        let sleep_ms = 60_000 - ms_into_minute;
        tokio::time::sleep(Duration::from_millis(sleep_ms)).await;

        let unix_secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let active_preset_id = match get_active_preset_id(&app) {
            Some(id) => id,
            None => continue,
        };

        let day_secs = unix_secs % 86400;
        let utc_trigger_time = (day_secs / 60 * 60) as i64;
        let iso_weekday = ((unix_secs / 86400 + 3) % 7 + 1) as i64;

        let schedules = sqlx::query_as::<_, TriggeredSchedule>(
            "SELECT s.id, s.label, s.custom_sound_id, cs.file_path as sound_file_path
             FROM schedule s
             JOIN schedule_weekday sw ON sw.schedule_id = s.id AND sw.weekday = ?1
             JOIN preset_business_day pbd ON pbd.preset_id = s.schedule_preset_id AND pbd.weekday = ?1
             LEFT JOIN custom_sound cs ON cs.id = s.custom_sound_id
             WHERE s.schedule_preset_id = ?2
               AND s.is_active = 1
               AND s.utc_trigger_time = ?3",
        )
        .bind(iso_weekday)
        .bind(active_preset_id)
        .bind(utc_trigger_time)
        .fetch_all(&pool)
        .await;

        let schedules = match schedules {
            Ok(s) => s,
            Err(_) => continue,
        };

        for schedule in &schedules {
            let sound_path = if let Some(ref file_path) = schedule.sound_file_path {
                app_data_dir.join(file_path)
            } else {
                default_bell_path.clone()
            };

            match play_sound(&sink_handle, &sound_path) {
                Ok(()) => {
                    log_trigger(&pool, schedule.id, "success", None).await;
                }
                Err(err) => {
                    log_trigger(&pool, schedule.id, "failed", Some(&err)).await;
                }
            }
        }
    }
}
