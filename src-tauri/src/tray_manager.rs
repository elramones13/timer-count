use crate::models::{Project, TimeSession};
use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem};
use tauri::{AppHandle, Runtime};
use std::collections::HashMap;
use chrono::Utc;

fn format_duration(start_time: &chrono::DateTime<Utc>) -> String {
    let now = Utc::now();
    let duration = now.signed_duration_since(*start_time);

    let hours = duration.num_hours();
    let minutes = duration.num_minutes() % 60;
    let seconds = duration.num_seconds() % 60;

    if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, seconds)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, seconds)
    } else {
        format!("{}s", seconds)
    }
}

pub fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    projects: Vec<Project>,
    running_sessions: Vec<TimeSession>,
) -> Result<Menu<R>, Box<dyn std::error::Error>> {
    // Map running sessions by project ID
    let running_map: HashMap<String, &TimeSession> = running_sessions
        .iter()
        .map(|s| (s.project_id.clone(), s))
        .collect();

    let mut menu_builder = MenuBuilder::new(app);

    // Show running sessions at the top
    if running_sessions.is_empty() {
        let no_active = MenuItemBuilder::with_id("no_active", "No hay proyectos activos")
            .enabled(false)
            .build(app)?;
        menu_builder = menu_builder.item(&no_active);
    } else {
        for session in &running_sessions {
            if let Some(project) = projects.iter().find(|p| p.id == session.project_id) {
                let duration = format_duration(&session.start_time);
                let display_text = format!("▶ {} - {}", project.name, duration);
                let item_id = format!("project_{}", project.id);

                let active_item = MenuItemBuilder::with_id(&item_id, &display_text)
                    .build(app)?;
                menu_builder = menu_builder.item(&active_item);
            }
        }
    }

    // Add separator
    let separator = PredefinedMenuItem::separator(app)?;
    menu_builder = menu_builder.item(&separator);

    // Add all projects submenu
    if !projects.is_empty() {
        let mut projects_submenu = SubmenuBuilder::new(app, "Iniciar Proyecto");

        for project in projects {
            let project_id = project.id.clone();
            let is_running = running_map.contains_key(&project_id);

            // Only show projects that are not running
            if !is_running {
                let item_id = format!("project_{}", project_id);
                let project_item = MenuItemBuilder::with_id(&item_id, &project.name)
                    .build(app)?;
                projects_submenu = projects_submenu.item(&project_item);
            }
        }

        let projects_menu = projects_submenu.build()?;
        menu_builder = menu_builder.item(&projects_menu);
    }

    // Add separator
    let separator2 = PredefinedMenuItem::separator(app)?;
    menu_builder = menu_builder.item(&separator2);

    // Add show window
    let show_window = MenuItemBuilder::with_id("show", "Mostrar Ventana").build(app)?;
    menu_builder = menu_builder.item(&show_window);

    // Add quit button
    let quit = MenuItemBuilder::with_id("quit", "Salir").build(app)?;
    menu_builder = menu_builder.item(&quit);

    Ok(menu_builder.build()?)
}

pub fn update_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    projects: Vec<Project>,
    running_sessions: Vec<TimeSession>,
) -> Result<(), Box<dyn std::error::Error>> {
    let tray = app.tray_by_id("main").ok_or("Tray not found")?;
    let menu = build_tray_menu(app, projects, running_sessions)?;
    tray.set_menu(Some(menu))?;
    Ok(())
}
