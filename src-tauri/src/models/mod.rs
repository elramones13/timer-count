use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub client_id: Option<String>,
    pub color: Option<String>,
    pub priority: i32, // 1 = low, 2 = medium, 3 = high, 4 = urgent
    pub status: String, // "active", "paused", "completed", "archived"
    pub estimated_hours: Option<f64>,
    pub hours_per_day: Option<f64>,
    pub hours_per_week: Option<f64>,
    pub deadline: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSession {
    pub id: String,
    pub project_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i64>,
    pub notes: Option<String>,
    pub is_running: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStats {
    pub project_id: String,
    pub total_seconds: i64,
    pub total_hours: f64,
    pub session_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: String,
    pub total_seconds: i64,
    pub total_hours: f64,
    pub project_breakdown: Vec<ProjectTimeBreakdown>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTimeBreakdown {
    pub project_id: String,
    pub project_name: String,
    pub client_name: Option<String>,
    pub total_seconds: i64,
    pub total_hours: f64,
}
