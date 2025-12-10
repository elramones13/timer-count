use crate::models::TimeSession;
use chrono::{DateTime, Utc};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_all_sessions(db: State<Mutex<Connection>>) -> Result<Vec<TimeSession>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
             FROM time_sessions ORDER BY start_time DESC"
        )
        .map_err(|e| e.to_string())?;

    let sessions = stmt
        .query_map([], |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<TimeSession>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

#[tauri::command]
pub fn get_running_sessions(db: State<Mutex<Connection>>) -> Result<Vec<TimeSession>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
             FROM time_sessions WHERE is_running = 1 ORDER BY start_time DESC"
        )
        .map_err(|e| e.to_string())?;

    let sessions = stmt
        .query_map([], |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<TimeSession>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

#[tauri::command]
pub fn get_project_sessions(
    db: State<Mutex<Connection>>,
    project_id: String,
) -> Result<Vec<TimeSession>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
             FROM time_sessions WHERE project_id = ?1 ORDER BY start_time DESC"
        )
        .map_err(|e| e.to_string())?;

    let sessions = stmt
        .query_map([&project_id], |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<TimeSession>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

#[tauri::command]
pub fn start_session(
    db: State<Mutex<Connection>>,
    project_id: String,
) -> Result<TimeSession, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO time_sessions (id, project_id, start_time, is_running, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            &id,
            &project_id,
            &now.to_rfc3339(),
            1,
            &now.to_rfc3339(),
            &now.to_rfc3339()
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(TimeSession {
        id,
        project_id,
        start_time: now,
        end_time: None,
        duration_seconds: None,
        notes: None,
        is_running: true,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn stop_session(
    db: State<Mutex<Connection>>,
    session_id: String,
    notes: Option<String>,
) -> Result<TimeSession, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    // Get the session to calculate duration
    let session = conn
        .query_row(
            "SELECT start_time FROM time_sessions WHERE id = ?1",
            [&session_id],
            |row| {
                let start_time_str: String = row.get(0)?;
                let start_time: DateTime<Utc> = start_time_str.parse().unwrap();
                Ok(start_time)
            },
        )
        .map_err(|e| e.to_string())?;

    let duration_seconds = (now - session).num_seconds();

    conn.execute(
        "UPDATE time_sessions SET end_time = ?1, duration_seconds = ?2, notes = ?3, is_running = 0, updated_at = ?4 WHERE id = ?5",
        rusqlite::params![
            &now.to_rfc3339(),
            &duration_seconds,
            &notes,
            &now.to_rfc3339(),
            &session_id
        ],
    )
    .map_err(|e| e.to_string())?;

    // Return the updated session
    conn.query_row(
        "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
         FROM time_sessions WHERE id = ?1",
        [&session_id],
        |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_session_notes(
    db: State<Mutex<Connection>>,
    session_id: String,
    notes: Option<String>,
) -> Result<TimeSession, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    conn.execute(
        "UPDATE time_sessions SET notes = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![&notes, &now.to_rfc3339(), &session_id],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
         FROM time_sessions WHERE id = ?1",
        [&session_id],
        |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_session(
    db: State<Mutex<Connection>>,
    session_id: String,
    project_id: String,
    start_time: DateTime<Utc>,
    end_time: DateTime<Utc>,
    notes: Option<String>,
) -> Result<TimeSession, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    // Calculate duration from start_time and end_time
    let duration_seconds = (end_time - start_time).num_seconds();

    // Ensure duration is positive
    if duration_seconds < 0 {
        return Err("End time must be after start time".to_string());
    }

    conn.execute(
        "UPDATE time_sessions SET project_id = ?1, start_time = ?2, end_time = ?3,
         duration_seconds = ?4, notes = ?5, updated_at = ?6 WHERE id = ?7",
        rusqlite::params![
            &project_id,
            &start_time.to_rfc3339(),
            &end_time.to_rfc3339(),
            &duration_seconds,
            &notes,
            &now.to_rfc3339(),
            &session_id
        ],
    )
    .map_err(|e| e.to_string())?;

    // Return the updated session
    conn.query_row(
        "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
         FROM time_sessions WHERE id = ?1",
        [&session_id],
        |row| {
            Ok(TimeSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get::<_, String>(2)?.parse().unwrap(),
                end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                duration_seconds: row.get(4)?,
                notes: row.get(5)?,
                is_running: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap(),
                updated_at: row.get::<_, String>(8)?.parse().unwrap(),
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_all_running_sessions(db: State<Mutex<Connection>>) -> Result<Vec<TimeSession>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    // Get all running sessions
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, start_time FROM time_sessions WHERE is_running = 1"
        )
        .map_err(|e| e.to_string())?;

    let running_sessions: Vec<(String, String, String)> = stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    drop(stmt);

    // Stop each session
    let mut stopped_sessions = Vec::new();
    for (session_id, _project_id, start_time_str) in running_sessions {
        let start_time: DateTime<Utc> = start_time_str.parse().map_err(|e| format!("Parse error: {}", e))?;
        let duration_seconds = (now - start_time).num_seconds();

        conn.execute(
            "UPDATE time_sessions SET end_time = ?1, duration_seconds = ?2, is_running = 0,
             notes = COALESCE(notes, '') || ' [Auto-pausado]', updated_at = ?3 WHERE id = ?4",
            rusqlite::params![
                &now.to_rfc3339(),
                &duration_seconds,
                &now.to_rfc3339(),
                &session_id
            ],
        )
        .map_err(|e| e.to_string())?;

        // Get the updated session
        let session = conn
            .query_row(
                "SELECT id, project_id, start_time, end_time, duration_seconds, notes, is_running, created_at, updated_at
                 FROM time_sessions WHERE id = ?1",
                [&session_id],
                |row| {
                    Ok(TimeSession {
                        id: row.get(0)?,
                        project_id: row.get(1)?,
                        start_time: row.get::<_, String>(2)?.parse().unwrap(),
                        end_time: row.get::<_, Option<String>>(3)?.map(|d| d.parse().unwrap()),
                        duration_seconds: row.get(4)?,
                        notes: row.get(5)?,
                        is_running: row.get::<_, i32>(6)? == 1,
                        created_at: row.get::<_, String>(7)?.parse().unwrap(),
                        updated_at: row.get::<_, String>(8)?.parse().unwrap(),
                    })
                },
            )
            .map_err(|e| e.to_string())?;

        stopped_sessions.push(session);
    }

    Ok(stopped_sessions)
}

#[tauri::command]
pub fn delete_session(db: State<Mutex<Connection>>, session_id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM time_sessions WHERE id = ?1", [&session_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
