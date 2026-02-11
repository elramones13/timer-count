use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotionSessionPayload {
    pub project_name: String,
    pub date: String,          // YYYY-MM-DD
    pub duration_minutes: f64, // Duration in minutes (Notion "Duration" field)
    pub notes: Option<String>,
}

#[command]
pub async fn sync_sessions_to_notion(
    token: String,
    database_id: String,
    notion_user_id: Option<String>,
    sessions: Vec<NotionSessionPayload>,
) -> Result<u32, String> {
    let client = reqwest::Client::new();
    let mut synced_count = 0u32;

    for session in &sessions {
        let duration_rounded = (session.duration_minutes * 100.0).round() / 100.0;

        let mut properties = serde_json::json!({
            "Nombre": {
                "title": [{"text": {"content": session.project_name}}]
            },
            "Proyecto": {
                "select": {"name": session.project_name}
            },
            "Fecha": {
                "date": {"start": session.date}
            },
            "Duration": {
                "number": duration_rounded
            }
        });

        if let Some(notes) = &session.notes {
            if !notes.is_empty() {
                properties["Comentarios"] = serde_json::json!({
                    "rich_text": [{"text": {"content": notes}}]
                });
            }
        }

        if let Some(user_id) = &notion_user_id {
            if !user_id.is_empty() {
                properties["Persona"] = serde_json::json!({
                    "people": [{"object": "user", "id": user_id}]
                });
            }
        }

        let body = serde_json::json!({
            "parent": {"database_id": database_id},
            "properties": properties
        });

        let response = client
            .post("https://api.notion.com/v1/pages")
            .header("Authorization", format!("Bearer {}", token))
            .header("Content-Type", "application/json")
            .header("Notion-Version", "2022-06-28")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Error de conexión con Notion: {}", e))?;

        if response.status().is_success() {
            synced_count += 1;
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!(
                "Error de la API de Notion ({}): {}",
                status, error_text
            ));
        }
    }

    Ok(synced_count)
}
