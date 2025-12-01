use crate::models::{Project, TimeSession};
use crate::tray_manager;
use tauri::{AppHandle, Runtime};

#[tauri::command]
pub fn update_tray_menu<R: Runtime>(
    app: AppHandle<R>,
    projects: Vec<Project>,
    running_sessions: Vec<TimeSession>,
) -> Result<(), String> {
    tray_manager::update_tray_menu(&app, projects, running_sessions)
        .map_err(|e| e.to_string())
}
