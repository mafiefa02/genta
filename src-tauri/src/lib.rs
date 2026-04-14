mod scheduler;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add preset business days",
            sql: include_str!("../migrations/0002_preset_business_days.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add trigger log status",
            sql: include_str!("../migrations/0003_trigger_log_status.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "set null on schedule delete for trigger log",
            sql: include_str!("../migrations/0004_trigger_log_set_null_on_delete.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "drop schedule next trigger at",
            sql: include_str!("../migrations/0005_drop_next_trigger_at.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window.hide().unwrap();
                #[cfg(all(target_os = "macos", not(debug_assertions)))]
                let _ = window
                    .app_handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
            _ => {}
        })
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let window = app.get_webview_window("main").expect("no main window");
            let _ = window.show();
            let _ = window.set_focus();
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:genta.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            #[cfg(all(target_os = "macos", not(debug_assertions)))]
                            {
                                let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                                let _ = app.show();
                            }
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = scheduler::start(handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
