use crate::models::Client;
use chrono::Utc;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_all_clients(db: State<Mutex<Connection>>) -> Result<Vec<Client>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, description, color, created_at, updated_at FROM clients ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let clients = stmt
        .query_map([], |row| {
            Ok(Client {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get::<_, String>(4)?.parse().unwrap(),
                updated_at: row.get::<_, String>(5)?.parse().unwrap(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Client>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(clients)
}

#[tauri::command]
pub fn get_client(db: State<Mutex<Connection>>, id: String) -> Result<Client, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let client = conn
        .query_row(
            "SELECT id, name, description, color, created_at, updated_at FROM clients WHERE id = ?1",
            [&id],
            |row| {
                Ok(Client {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    created_at: row.get::<_, String>(4)?.parse().unwrap(),
                    updated_at: row.get::<_, String>(5)?.parse().unwrap(),
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(client)
}

#[tauri::command]
pub fn create_client(
    db: State<Mutex<Connection>>,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<Client, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO clients (id, name, description, color, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![&id, &name, &description, &color, &now.to_rfc3339(), &now.to_rfc3339()],
    )
    .map_err(|e| e.to_string())?;

    Ok(Client {
        id,
        name,
        description,
        color,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_client(
    db: State<Mutex<Connection>>,
    id: String,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<Client, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    conn.execute(
        "UPDATE clients SET name = ?1, description = ?2, color = ?3, updated_at = ?4 WHERE id = ?5",
        rusqlite::params![&name, &description, &color, &now.to_rfc3339(), &id],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    get_client(db, id)
}

#[tauri::command]
pub fn delete_client(db: State<Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM clients WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
