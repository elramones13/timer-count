use crate::models::Project;
use chrono::{DateTime, Utc};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_all_projects(db: State<Mutex<Connection>>) -> Result<Vec<Project>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, client_id, color, priority, status,
             estimated_hours, hours_per_day, hours_per_week, deadline, created_at, updated_at
             FROM projects ORDER BY deadline IS NULL, deadline ASC, priority DESC, name ASC"
        )
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                client_id: row.get(3)?,
                color: row.get(4)?,
                priority: row.get(5)?,
                status: row.get(6)?,
                estimated_hours: row.get(7)?,
                hours_per_day: row.get(8)?,
                hours_per_week: row.get(9)?,
                deadline: row.get::<_, Option<String>>(10)?.map(|d| d.parse().unwrap()),
                created_at: row.get::<_, String>(11)?.parse().unwrap(),
                updated_at: row.get::<_, String>(12)?.parse().unwrap(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Project>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects)
}

#[tauri::command]
pub fn get_project(db: State<Mutex<Connection>>, id: String) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let project = conn
        .query_row(
            "SELECT id, name, description, client_id, color, priority, status,
             estimated_hours, hours_per_day, hours_per_week, deadline, created_at, updated_at
             FROM projects WHERE id = ?1",
            [&id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    client_id: row.get(3)?,
                    color: row.get(4)?,
                    priority: row.get(5)?,
                    status: row.get(6)?,
                    estimated_hours: row.get(7)?,
                    hours_per_day: row.get(8)?,
                    hours_per_week: row.get(9)?,
                    deadline: row.get::<_, Option<String>>(10)?.map(|d| d.parse().unwrap()),
                    created_at: row.get::<_, String>(11)?.parse().unwrap(),
                    updated_at: row.get::<_, String>(12)?.parse().unwrap(),
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub fn create_project(
    db: State<Mutex<Connection>>,
    name: String,
    description: Option<String>,
    client_id: Option<String>,
    color: Option<String>,
    priority: i32,
    status: String,
    estimated_hours: Option<f64>,
    hours_per_day: Option<f64>,
    hours_per_week: Option<f64>,
    deadline: Option<DateTime<Utc>>,
) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO projects (id, name, description, client_id, color, priority, status,
         estimated_hours, hours_per_day, hours_per_week, deadline, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            &id,
            &name,
            &description,
            &client_id,
            &color,
            &priority,
            &status,
            &estimated_hours,
            &hours_per_day,
            &hours_per_week,
            &deadline.map(|d| d.to_rfc3339()),
            &now.to_rfc3339(),
            &now.to_rfc3339()
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Project {
        id,
        name,
        description,
        client_id,
        color,
        priority,
        status,
        estimated_hours,
        hours_per_day,
        hours_per_week,
        deadline,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_project(
    db: State<Mutex<Connection>>,
    id: String,
    name: String,
    description: Option<String>,
    client_id: Option<String>,
    color: Option<String>,
    priority: i32,
    status: String,
    estimated_hours: Option<f64>,
    hours_per_day: Option<f64>,
    hours_per_week: Option<f64>,
    deadline: Option<DateTime<Utc>>,
) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, client_id = ?3, color = ?4,
         priority = ?5, status = ?6, estimated_hours = ?7, hours_per_day = ?8,
         hours_per_week = ?9, deadline = ?10, updated_at = ?11 WHERE id = ?12",
        rusqlite::params![
            &name,
            &description,
            &client_id,
            &color,
            &priority,
            &status,
            &estimated_hours,
            &hours_per_day,
            &hours_per_week,
            &deadline.map(|d| d.to_rfc3339()),
            &now.to_rfc3339(),
            &id
        ],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    get_project(db, id)
}

#[tauri::command]
pub fn delete_project(db: State<Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM projects WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
