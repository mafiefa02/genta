use chrono::{Datelike, Local, Timelike};
use rodio::{source::SineWave, Decoder, OutputStream, Sink, Source};
use sqlx::{sqlite::SqlitePool, Row};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tauri::Manager;

#[derive(serde::Deserialize, Clone)]
struct AppSettings {
    active_profile: Option<i64>,
}

struct SchedulerContext {
    db_pool: SqlitePool,
    config_path: PathBuf,
    default_sound_path: PathBuf,
}

pub fn start_scheduler(app: &tauri::AppHandle) {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .expect("failed to get app config dir");
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("failed to get resource dir");

    let context = Arc::new(SchedulerContext {
        db_pool: block_on_db_connect(app_config_dir.join("genta.db")),
        config_path: app_config_dir.join("config.json"),
        default_sound_path: resource_dir.join("resources").join("default_sound.wav"),
    });

    tauri::async_runtime::spawn(async move {
        run_scheduler_loop(context).await;
    });
}

fn block_on_db_connect(db_path: PathBuf) -> SqlitePool {
    let db_url = format!("sqlite:{}", db_path.to_string_lossy());
    println!("Connecting to Scheduler DB: {}", db_url);

    tauri::async_runtime::block_on(async {
        SqlitePool::connect(&db_url).await.unwrap_or_else(|e| {
            panic!("Failed to connect to scheduler DB at {}: {}", db_url, e);
        })
    })
}

async fn run_scheduler_loop(ctx: Arc<SchedulerContext>) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    let mut last_processed_minute: Option<u32> = None;

    let mut cached_settings: Option<AppSettings> = None;
    let mut last_config_mod_time: Option<SystemTime> = None;

    loop {
        interval.tick().await;
        let now = Local::now();

        let current_minute_checksum = now.minute();
        if last_processed_minute == Some(current_minute_checksum) {
            continue;
        }

        if let Some(settings) =
            refresh_config_if_needed(&ctx.config_path, &mut last_config_mod_time)
        {
            cached_settings = Some(settings);
        }

        if let Some(settings) = &cached_settings {
            if let Some(profile_id) = settings.active_profile {
                match check_schedules(&ctx.db_pool, now, profile_id).await {
                    Ok(sounds) => {
                        for sound_file in sounds {
                            play_sound_thread(sound_file, ctx.default_sound_path.clone());
                        }
                    }
                    Err(e) => eprintln!("Scheduler DB Error: {}", e),
                }
            }
        }

        last_processed_minute = Some(current_minute_checksum);
    }
}

fn refresh_config_if_needed(path: &Path, last_mod: &mut Option<SystemTime>) -> Option<AppSettings> {
    if !path.exists() {
        return None;
    }

    let metadata = fs::metadata(path).ok()?;
    let modified = metadata.modified().ok()?;

    // If timestamp hasn't changed, don't re-read file
    if let Some(last) = *last_mod {
        if modified <= last {
            return None;
        }
    }

    *last_mod = Some(modified);

    match fs::read_to_string(path) {
        Ok(content) => match serde_json::from_str::<AppSettings>(&content) {
            Ok(settings) => Some(settings),
            Err(e) => {
                eprintln!("Failed to parse config.json: {}", e);
                None
            }
        },
        Err(e) => {
            eprintln!("Failed to read config.json: {}", e);
            None
        }
    }
}

fn play_sound_thread(file_path: Option<String>, default_sound_path: PathBuf) {
    std::thread::spawn(move || {
        let (_stream, stream_handle) = match OutputStream::try_default() {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to initialize audio output stream: {}", e);
                return;
            }
        };

        let sink = match Sink::try_new(&stream_handle) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to create audio sink: {}", e);
                return;
            }
        };

        if let Some(path_str) = file_path {
            let path = Path::new(&path_str);
            if attempt_play_file(&sink, path).is_ok() {
                return;
            }
            eprintln!(
                "Failed to play sound: {}, falling back to default",
                path_str
            );
        }

        if attempt_play_file(&sink, &default_sound_path).is_err() {
            eprintln!("Failed to play default sound, falling back to beep");
            play_fallback_beep(&sink);
        }
    });
}

fn attempt_play_file(sink: &Sink, path: &Path) -> Result<(), ()> {
    if !path.exists() {
        return Err(());
    }

    let file = File::open(path).map_err(|_| ())?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader).map_err(|_| ())?;

    sink.append(source);
    sink.sleep_until_end();
    Ok(())
}

fn play_fallback_beep(sink: &Sink) {
    let source = SineWave::new(440.0)
        .take_duration(Duration::from_secs_f32(1.0))
        .amplify(0.20);
    sink.append(source);
    sink.sleep_until_end();
}

async fn check_schedules(
    pool: &SqlitePool,
    now: chrono::DateTime<Local>,
    profile_id: i64,
) -> Result<Vec<Option<String>>, sqlx::Error> {
    let current_minutes = (now.hour() * 60 + now.minute()) as i64;
    let today_str = now.format("%Y-%m-%d").to_string();
    let day_of_week = now.weekday().number_from_monday() as i32;

    let query = r#"
        SELECT
            s.id,
            COALESCE(snd_override.file_name, snd.file_name) as sound_file_name
        FROM schedules s
        LEFT JOIN schedule_overrides so ON s.id = so.schedule_id AND so.original_date = ?1
        LEFT JOIN sounds snd ON s.sound_id = snd.id
        LEFT JOIN sounds snd_override ON so.new_sound_id = snd_override.id
        WHERE
            s.profile_id = ?2
            AND s.is_active = 1
            AND (so.is_cancelled IS NULL OR so.is_cancelled = 0)
            -- Effective time check
            AND COALESCE(so.new_time, s.time) = ?3
            -- Recurrence check
            AND (
                (s.repeat = 'once' AND s.start_date = ?4)
                OR
                (s.repeat = 'weekly' AND s.start_date <= ?5 AND (s.end_date IS NULL OR s.end_date >= ?6)
                 AND EXISTS (SELECT 1 FROM schedule_days sd WHERE sd.schedule_id = s.id AND sd.day_of_week = ?7))
            )
    "#;

    let rows = sqlx::query(query)
        .bind(&today_str) // 1. override date
        .bind(profile_id) // 2. profile
        .bind(current_minutes) // 3. time
        .bind(&today_str) // 4. once date
        .bind(&today_str) // 5. weekly start
        .bind(&today_str) // 6. weekly end
        .bind(day_of_week) // 7. day of week
        .fetch_all(pool)
        .await?;

    let sounds_to_play = rows
        .into_iter()
        .map(|row| row.try_get("sound_file_name").ok())
        .collect();

    Ok(sounds_to_play)
}
