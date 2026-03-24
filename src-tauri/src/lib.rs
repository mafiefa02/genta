use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::time::SystemTime;
use tauri::Manager;
use tauri_plugin_sql::Migration;

mod scheduler;

#[tauri::command]
async fn save_sound(
    app: tauri::AppHandle,
    file_name: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let app_config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let sounds_dir = app_config_dir.join("sounds");

    if !sounds_dir.exists() {
        fs::create_dir_all(&sounds_dir).map_err(|e| e.to_string())?;
    }

    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let unique_name = format!("{}_{}", timestamp, file_name);
    let file_path = sounds_dir.join(&unique_name);

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(&data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn delete_sound_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn read_sound_file(file_path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    match std::fs::read(path) {
        Ok(data) => Ok(data),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_url = "sqlite:kron.db";

    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../db/migrations/0001_initial_schema.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_business_days",
            sql: include_str!("../db/migrations/0002_add_business_days.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .setup(|app| {
            scheduler::start_scheduler(app.handle());
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(db_url, migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_sound,
            delete_sound_file,
            read_sound_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
