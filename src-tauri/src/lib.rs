mod commands;
mod database;
mod models;
mod tray_manager;
mod system_events;

use std::sync::Mutex;
use tauri::Manager;
use tauri::tray::TrayIconBuilder;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let conn = database::init_database(app.handle())?;
            app.manage(Mutex::new(conn));

            // Build initial tray menu with projects
            let app_handle = app.handle();
            let projects = commands::projects::get_all_projects(
                app.state::<Mutex<rusqlite::Connection>>()
            ).unwrap_or_default();

            let running_sessions = commands::sessions::get_running_sessions(
                app.state::<Mutex<rusqlite::Connection>>()
            ).unwrap_or_default();

            let initial_menu = tray_manager::build_tray_menu(&app_handle, projects, running_sessions)?;

            // Create tray icon
            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&initial_menu)
                .show_menu_on_left_click(true)
                .on_tray_icon_event(|tray, event| {
                    use tauri::tray::TrayIconEvent;
                    match event {
                        TrayIconEvent::Enter { .. } => {
                            // Update menu when mouse enters the tray icon (before click)
                            let app = tray.app_handle();
                            if let Ok(projects) = commands::projects::get_all_projects(
                                app.state::<Mutex<rusqlite::Connection>>()
                            ) {
                                if let Ok(running) = commands::sessions::get_running_sessions(
                                    app.state::<Mutex<rusqlite::Connection>>()
                                ) {
                                    let _ = tray_manager::update_tray_menu(&app, projects, running);
                                }
                            }
                        }
                        _ => {}
                    }
                })
                .on_menu_event(move |app, event| {
                    let event_id = event.id().as_ref();
                    match event_id {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            // Stop all running sessions before quitting
                            if let Some(db) = app.try_state::<Mutex<rusqlite::Connection>>() {
                                let _ = commands::sessions::stop_all_running_sessions(db.clone());
                                println!("All running sessions stopped before app exit");
                            }
                            app.exit(0);
                        }
                        id if id.starts_with("project_") => {
                            // Extract project ID and handle toggle
                            let project_id = id.trim_start_matches("project_").to_string();
                            let app_handle = app.clone();

                            // Run in a separate task to avoid blocking the menu
                            tauri::async_runtime::spawn(async move {
                                // Get running sessions
                                let running_sessions = match commands::sessions::get_running_sessions(
                                    app_handle.state::<Mutex<rusqlite::Connection>>()
                                ) {
                                    Ok(sessions) => sessions,
                                    Err(_) => return,
                                };

                                // Check if this project is running
                                let running_session = running_sessions.iter().find(|s| s.project_id == project_id);

                                if let Some(session) = running_session {
                                    // Stop the session
                                    let _ = commands::sessions::stop_session(
                                        app_handle.state::<Mutex<rusqlite::Connection>>(),
                                        session.id.clone(),
                                        None,
                                    );
                                } else {
                                    // Start a new session
                                    let _ = commands::sessions::start_session(
                                        app_handle.state::<Mutex<rusqlite::Connection>>(),
                                        project_id.clone(),
                                    );
                                }

                                // Update tray menu
                                if let Ok(projects) = commands::projects::get_all_projects(
                                    app_handle.state::<Mutex<rusqlite::Connection>>()
                                ) {
                                    if let Ok(running) = commands::sessions::get_running_sessions(
                                        app_handle.state::<Mutex<rusqlite::Connection>>()
                                    ) {
                                        let _ = tray_manager::update_tray_menu(&app_handle, projects, running);
                                    }
                                }

                                // Notify window if it's open
                                if let Some(window) = app_handle.get_webview_window("main") {
                                    let _ = window.emit("tray-project-toggled", ());
                                }
                            });
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Setup system event listeners for detecting sleep/lock
            system_events::setup_system_event_listeners(app);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Don't close the app, just hide the window
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Client commands
            commands::clients::get_all_clients,
            commands::clients::get_client,
            commands::clients::create_client,
            commands::clients::update_client,
            commands::clients::delete_client,
            // Project commands
            commands::projects::get_all_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,
            // Session commands
            commands::sessions::get_all_sessions,
            commands::sessions::get_running_sessions,
            commands::sessions::get_project_sessions,
            commands::sessions::start_session,
            commands::sessions::stop_session,
            commands::sessions::update_session_notes,
            commands::sessions::update_session,
            commands::sessions::stop_all_running_sessions,
            commands::sessions::delete_session,
            // Stats commands
            commands::stats::get_project_stats,
            commands::stats::get_all_projects_stats,
            commands::stats::get_daily_stats,
            commands::stats::get_date_range_stats,
            // Tray commands
            commands::tray::update_tray_menu,
            // Export commands
            commands::export::export_daily_backup,
            commands::export::save_daily_backup,
            commands::export::generate_pdf_report,
            commands::export::get_current_month_range,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
