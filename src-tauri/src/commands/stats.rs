use crate::models::{DailyStats, ProjectStats, ProjectTimeBreakdown};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn get_project_stats(
    db: State<Mutex<Connection>>,
    project_id: String,
) -> Result<ProjectStats, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let stats = conn
        .query_row(
            "SELECT
                project_id,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(duration_seconds) / 3600.0, 0) as total_hours,
                COUNT(*) as session_count
             FROM time_sessions
             WHERE project_id = ?1 AND is_running = 0
             GROUP BY project_id",
            [&project_id],
            |row| {
                Ok(ProjectStats {
                    project_id: row.get(0)?,
                    total_seconds: row.get(1)?,
                    total_hours: row.get(2)?,
                    session_count: row.get(3)?,
                })
            },
        )
        .unwrap_or_else(|_| ProjectStats {
            project_id: project_id.clone(),
            total_seconds: 0,
            total_hours: 0.0,
            session_count: 0,
        });

    Ok(stats)
}

#[tauri::command]
pub fn get_all_projects_stats(db: State<Mutex<Connection>>) -> Result<Vec<ProjectStats>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT
                project_id,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(duration_seconds) / 3600.0, 0) as total_hours,
                COUNT(*) as session_count
             FROM time_sessions
             WHERE is_running = 0
             GROUP BY project_id
             ORDER BY total_seconds DESC"
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map([], |row| {
            Ok(ProjectStats {
                project_id: row.get(0)?,
                total_seconds: row.get(1)?,
                total_hours: row.get(2)?,
                session_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<ProjectStats>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(stats)
}

#[tauri::command]
pub fn get_daily_stats(
    db: State<Mutex<Connection>>,
    start_date: String,
    end_date: String,
) -> Result<Vec<DailyStats>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT
                DATE(start_time) as date,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(duration_seconds) / 3600.0, 0) as total_hours
             FROM time_sessions
             WHERE is_running = 0
             AND DATE(start_time) >= ?1
             AND DATE(start_time) <= ?2
             GROUP BY DATE(start_time)
             ORDER BY date ASC"
        )
        .map_err(|e| e.to_string())?;

    let mut daily_stats_vec = Vec::new();

    let rows = stmt
        .query_map([&start_date, &end_date], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let (date, total_seconds, total_hours) = row.map_err(|e| e.to_string())?;

        // Get project breakdown for this date
        let project_breakdown = get_project_breakdown_for_date(&conn, &date)?;

        daily_stats_vec.push(DailyStats {
            date,
            total_seconds,
            total_hours,
            project_breakdown,
        });
    }

    Ok(daily_stats_vec)
}

fn get_project_breakdown_for_date(
    conn: &Connection,
    date: &str,
) -> Result<Vec<ProjectTimeBreakdown>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT
                ts.project_id,
                p.name as project_name,
                c.name as client_name,
                COALESCE(SUM(ts.duration_seconds), 0) as total_seconds,
                COALESCE(SUM(ts.duration_seconds) / 3600.0, 0) as total_hours
             FROM time_sessions ts
             JOIN projects p ON ts.project_id = p.id
             LEFT JOIN clients c ON p.client_id = c.id
             WHERE ts.is_running = 0
             AND DATE(ts.start_time) = ?1
             GROUP BY ts.project_id, p.name, c.name
             ORDER BY total_seconds DESC"
        )
        .map_err(|e| e.to_string())?;

    let breakdown = stmt
        .query_map([date], |row| {
            Ok(ProjectTimeBreakdown {
                project_id: row.get(0)?,
                project_name: row.get(1)?,
                client_name: row.get(2)?,
                total_seconds: row.get(3)?,
                total_hours: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<ProjectTimeBreakdown>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(breakdown)
}

#[tauri::command]
pub fn get_date_range_stats(
    db: State<Mutex<Connection>>,
    start_date: String,
    end_date: String,
) -> Result<Vec<ProjectTimeBreakdown>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT
                ts.project_id,
                p.name as project_name,
                c.name as client_name,
                COALESCE(SUM(ts.duration_seconds), 0) as total_seconds,
                COALESCE(SUM(ts.duration_seconds) / 3600.0, 0) as total_hours
             FROM time_sessions ts
             JOIN projects p ON ts.project_id = p.id
             LEFT JOIN clients c ON p.client_id = c.id
             WHERE ts.is_running = 0
             AND DATE(ts.start_time) >= ?1
             AND DATE(ts.start_time) <= ?2
             GROUP BY ts.project_id, p.name, c.name
             ORDER BY total_seconds DESC"
        )
        .map_err(|e| e.to_string())?;

    let breakdown = stmt
        .query_map([&start_date, &end_date], |row| {
            Ok(ProjectTimeBreakdown {
                project_id: row.get(0)?,
                project_name: row.get(1)?,
                client_name: row.get(2)?,
                total_seconds: row.get(3)?,
                total_hours: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<ProjectTimeBreakdown>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(breakdown)
}
