use crate::commands::{projects, sessions, stats};
use crate::models::{DailyStats, Project, TimeSession};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use chrono::{NaiveDate, Datelike};
use std::collections::HashMap;

use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

fn format_duration_from_seconds(seconds: i64) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;

    if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, secs)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, secs)
    } else {
        format!("{}s", secs)
    }
}


#[derive(serde::Serialize)]
struct DailyBackup {
    date: String,
    sessions: Vec<TimeSession>,
    stats: Vec<DailyStats>,
    projects: Vec<Project>,
}

/// Export daily backup as JSON
#[tauri::command]
pub fn export_daily_backup(
    db: State<Mutex<Connection>>,
    date: String,
) -> Result<String, String> {
    let all_sessions = sessions::get_all_sessions(db.clone())?;
    let all_projects = projects::get_all_projects(db.clone())?;

    // Filter sessions for the specific date
    let day_sessions: Vec<TimeSession> = all_sessions
        .into_iter()
        .filter(|s| {
            s.start_time.format("%Y-%m-%d").to_string() == date
        })
        .collect();

    let stats = stats::get_daily_stats(db, date.clone(), date.clone())?;

    let backup = DailyBackup {
        date,
        sessions: day_sessions,
        stats,
        projects: all_projects,
    };

    serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())
}

/// Save daily backup to file
#[tauri::command]
pub fn save_daily_backup(
    db: State<Mutex<Connection>>,
    date: String,
    file_path: String,
) -> Result<(), String> {
    let json_data = export_daily_backup(db, date)?;
    std::fs::write(&file_path, json_data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Generate PDF report for date range
#[tauri::command]
pub fn generate_pdf_report(
    db: State<Mutex<Connection>>,
    start_date: String,
    end_date: String,
    file_path: String,
) -> Result<(), String> {
    // Get data
    let daily_stats = stats::get_daily_stats(db.clone(), start_date.clone(), end_date.clone())?;
    let all_sessions = sessions::get_all_sessions(db.clone())?;
    let all_projects = projects::get_all_projects(db)?;

    // Filter sessions for date range
    let range_sessions: Vec<TimeSession> = all_sessions
        .into_iter()
        .filter(|s| {
            let session_date = s.start_time.format("%Y-%m-%d").to_string();
            session_date >= start_date && session_date <= end_date && !s.is_running
        })
        .collect();

    // Create PDF document (A4 size)
    let (doc, page1, layer1) = PdfDocument::new("Reporte de Tiempo", Mm(210.0), Mm(297.0), "Capa 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    // Fonts
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;
    let font_regular = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;

    // Colors
    let blue = Color::Rgb(Rgb::new(41.0/255.0, 128.0/255.0, 185.0/255.0, None));
    let dark_gray = Color::Rgb(Rgb::new(52.0/255.0, 73.0/255.0, 94.0/255.0, None));
    let green = Color::Rgb(Rgb::new(39.0/255.0, 174.0/255.0, 96.0/255.0, None));
    let light_gray = Color::Rgb(Rgb::new(0.85, 0.85, 0.85, None));

    let mut y_position = 270.0; // Start from top

    // Title
    current_layer.set_fill_color(blue.clone());
    current_layer.use_text("══ REPORTE DE TIEMPO ══", 26.0, Mm(20.0), Mm(y_position), &font_bold);
    y_position -= 10.0;

    // Date range
    current_layer.set_fill_color(dark_gray.clone());
    let range_text = format!("Período: {} hasta {}", start_date, end_date);
    current_layer.use_text(&range_text, 13.0, Mm(20.0), Mm(y_position), &font_regular);
    y_position -= 15.0;

    // Total summary
    let total_seconds: i64 = daily_stats.iter()
        .map(|s| (s.total_hours * 3600.0) as i64)
        .sum();

    current_layer.set_fill_color(dark_gray.clone());
    current_layer.use_text("TIEMPO TOTAL:", 14.0, Mm(25.0), Mm(y_position), &font_bold);
    current_layer.set_fill_color(green.clone());
    let total_text = format_duration_from_seconds(total_seconds);
    current_layer.use_text(&total_text, 20.0, Mm(85.0), Mm(y_position - 1.0), &font_bold);

    current_layer.set_fill_color(dark_gray.clone());
    y_position -= 15.0;

    // Horizontal line
    let line_y = y_position + 2.0;
    let line_points = Line {
        points: vec![
            (Point::new(Mm(20.0), Mm(line_y)), false),
            (Point::new(Mm(190.0), Mm(line_y)), false),
        ],
        is_closed: false,
    };
    current_layer.set_outline_color(blue.clone());
    current_layer.set_outline_thickness(1.0);
    current_layer.add_line(line_points);
    y_position -= 5.0;

    // Group sessions by date
    let mut sessions_by_date: HashMap<String, Vec<&TimeSession>> = HashMap::new();
    for session in &range_sessions {
        let date = session.start_time.format("%Y-%m-%d").to_string();
        sessions_by_date.entry(date).or_insert_with(Vec::new).push(session);
    }

    // Sort dates
    let mut dates: Vec<String> = sessions_by_date.keys().cloned().collect();
    dates.sort_by(|a, b| b.cmp(a)); // Descending

    // Print each day
    for date in dates {
        if y_position < 30.0 {
            // Need new page
            let (_new_page, _new_layer) = doc.add_page(Mm(210.0), Mm(297.0), "Capa");
            y_position = 270.0;
        }

        y_position -= 8.0;

        // Calculate day total
        let day_total_seconds: i64 = sessions_by_date.get(&date)
            .map(|sessions| sessions.iter()
                .map(|s| s.duration_seconds.unwrap_or(0) as i64)
                .sum())
            .unwrap_or(0);

        // Day header underline
        let day_underline = Line {
            points: vec![
                (Point::new(Mm(20.0), Mm(y_position - 6.0)), false),
                (Point::new(Mm(190.0), Mm(y_position - 6.0)), false),
            ],
            is_closed: false,
        };
        current_layer.set_outline_color(light_gray.clone());
        current_layer.set_outline_thickness(0.5);
        current_layer.add_line(day_underline);

        // Day date
        current_layer.set_fill_color(blue.clone());
        let date_formatted = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
            .map(|d| d.format("%A, %d de %B de %Y").to_string())
            .unwrap_or(date.clone());
        current_layer.use_text(&date_formatted, 14.0, Mm(25.0), Mm(y_position - 2.0), &font_bold);

        // Day total (right aligned)
        current_layer.set_fill_color(green.clone());
        let day_total_text = format_duration_from_seconds(day_total_seconds);
        current_layer.use_text(&day_total_text, 12.0, Mm(160.0), Mm(y_position - 2.0), &font_bold);

        current_layer.set_fill_color(dark_gray.clone());
        y_position -= 10.0;

        if let Some(sessions) = sessions_by_date.get(&date) {
            for session in sessions {
                if y_position < 30.0 {
                    let (_new_page, _new_layer) = doc.add_page(Mm(210.0), Mm(297.0), "Capa");
                    y_position = 270.0;
                }

                let project = all_projects.iter().find(|p| p.id == session.project_id);
                let project_name = project.map(|p| p.name.as_str()).unwrap_or("Desconocido");

                let duration_seconds = session.duration_seconds.unwrap_or(0) as i64;
                let duration_formatted = format_duration_from_seconds(duration_seconds);
                let start_time = session.start_time.format("%H:%M").to_string();
                let end_time = session.end_time.as_ref()
                    .map(|et| et.format("%H:%M").to_string())
                    .unwrap_or_else(|| "-".to_string());

                // Session bullet point
                current_layer.set_fill_color(blue.clone());
                current_layer.use_text("•", 14.0, Mm(28.0), Mm(y_position), &font_bold);

                // Time range
                current_layer.set_fill_color(dark_gray.clone());
                let time_text = format!("{} - {}", start_time, end_time);
                current_layer.use_text(&time_text, 11.0, Mm(33.0), Mm(y_position), &font_regular);

                // Project name
                current_layer.use_text(project_name, 11.0, Mm(60.0), Mm(y_position), &font_bold);

                // Duration (right aligned)
                current_layer.set_fill_color(green.clone());
                current_layer.use_text(&duration_formatted, 11.0, Mm(160.0), Mm(y_position), &font_bold);

                current_layer.set_fill_color(dark_gray.clone());
                y_position -= 5.0;

                if let Some(notes) = &session.notes {
                    if !notes.is_empty() {
                        let notes_text = if notes.len() > 80 {
                            format!("  📝 {}...", &notes[..77])
                        } else {
                            format!("  📝 {}", notes)
                        };
                        current_layer.use_text(&notes_text, 9.0, Mm(33.0), Mm(y_position), &font_regular);
                        y_position -= 5.0;
                    }
                }

                // Separator line
                let sep_line = Line {
                    points: vec![
                        (Point::new(Mm(28.0), Mm(y_position + 1.0)), false),
                        (Point::new(Mm(185.0), Mm(y_position + 1.0)), false),
                    ],
                    is_closed: false,
                };
                current_layer.set_outline_color(light_gray.clone());
                current_layer.set_outline_thickness(0.2);
                current_layer.add_line(sep_line);

                y_position -= 2.0;
            }
        }
    }

    // Save PDF
    doc.save(&mut BufWriter::new(File::create(&file_path).map_err(|e| e.to_string())?))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get current month date range
#[tauri::command]
pub fn get_current_month_range() -> Result<(String, String), String> {
    let now = chrono::Local::now();
    let year = now.year();
    let month = now.month();

    let first_day = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or("Invalid date")?;

    let last_day = if month == 12 {
        NaiveDate::from_ymd_opt(year, 12, 31)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
            .and_then(|d| d.pred_opt())
    }.ok_or("Invalid date")?;

    Ok((first_day.format("%Y-%m-%d").to_string(), last_day.format("%Y-%m-%d").to_string()))
}
