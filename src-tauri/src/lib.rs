use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Row, SqlitePool,
};
use std::fs;
use std::process::Command;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Snippet {
    pub id: String,
    pub content: String,
    pub tags: String,
    pub folder_id: Option<String>,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_todo: bool,
    pub is_done: bool,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub name: String,
    pub created_at: i64,
}

pub struct AppState {
    pub pool: SqlitePool,
}

fn normalize_tag_name(name: &str) -> Option<String> {
    let normalized = name.trim().trim_start_matches('#').to_lowercase();
    if normalized.is_empty() {
        None
    } else {
        Some(normalized)
    }
}

async fn ensure_tags_exist(pool: &SqlitePool, tags: &str, created_at: i64) -> Result<(), String> {
    for raw_tag in tags.split(',') {
        let Some(tag_name) = normalize_tag_name(raw_tag) else {
            continue;
        };

        sqlx::query(
            r#"
            INSERT INTO tags (name, created_at)
            VALUES (?1, ?2)
            ON CONFLICT(name) DO NOTHING
            "#,
        )
        .bind(tag_name)
        .bind(created_at)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

async fn seed_tags_from_existing_snippets(pool: &SqlitePool) -> Result<(), String> {
    let rows = sqlx::query("SELECT tags, created_at FROM snippets")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    for row in rows {
        let tags: String = row.get("tags");
        let created_at: i64 = row.get("created_at");
        ensure_tags_exist(pool, &tags, created_at).await?;
    }

    Ok(())
}

#[tauri::command]
async fn list_snippets(state: State<'_, AppState>) -> Result<Vec<Snippet>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, content, tags, folder_id,
               is_pinned, is_favorite, is_todo, is_done, is_archived,
               created_at, updated_at
        FROM snippets
        WHERE is_archived = 0
        ORDER BY is_pinned DESC, created_at DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|r| Snippet {
            id: r.get("id"),
            content: r.get("content"),
            tags: r.get("tags"),
            folder_id: r.get("folder_id"),
            is_pinned: r.get::<i64, _>("is_pinned") != 0,
            is_favorite: r.get::<i64, _>("is_favorite") != 0,
            is_todo: r.get::<i64, _>("is_todo") != 0,
            is_done: r.get::<i64, _>("is_done") != 0,
            is_archived: r.get::<i64, _>("is_archived") != 0,
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}

#[tauri::command]
async fn upsert_snippet(state: State<'_, AppState>, snippet: Snippet) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO snippets
          (id, content, tags, folder_id, is_pinned, is_favorite, is_todo,
           is_done, is_archived, created_at, updated_at)
        VALUES
          (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        ON CONFLICT(id) DO UPDATE SET
          content = excluded.content,
          tags = excluded.tags,
          folder_id = excluded.folder_id,
          is_pinned = excluded.is_pinned,
          is_favorite = excluded.is_favorite,
          is_todo = excluded.is_todo,
          is_done = excluded.is_done,
          is_archived = excluded.is_archived,
          updated_at = excluded.updated_at
        "#,
    )
    .bind(&snippet.id)
    .bind(&snippet.content)
    .bind(&snippet.tags)
    .bind(&snippet.folder_id)
    .bind(snippet.is_pinned as i64)
    .bind(snippet.is_favorite as i64)
    .bind(snippet.is_todo as i64)
    .bind(snippet.is_done as i64)
    .bind(snippet.is_archived as i64)
    .bind(snippet.created_at)
    .bind(snippet.updated_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    ensure_tags_exist(&state.pool, &snippet.tags, snippet.created_at).await?;

    Ok(())
}

#[tauri::command]
async fn delete_snippet(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM snippets WHERE id = ?1")
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn list_folders(state: State<'_, AppState>) -> Result<Vec<Folder>, String> {
    let rows = sqlx::query("SELECT id, name, created_at FROM folders ORDER BY created_at ASC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|r| Folder {
            id: r.get("id"),
            name: r.get("name"),
            created_at: r.get("created_at"),
        })
        .collect())
}

#[tauri::command]
async fn upsert_folder(state: State<'_, AppState>, folder: Folder) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO folders (id, name, created_at)
        VALUES (?1, ?2, ?3)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name
        "#,
    )
    .bind(&folder.id)
    .bind(&folder.name)
    .bind(folder.created_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_folder(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM folders WHERE id = ?1")
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn list_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, String> {
    let rows = sqlx::query("SELECT name, created_at FROM tags ORDER BY created_at ASC, name ASC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|r| Tag {
            name: r.get("name"),
            created_at: r.get("created_at"),
        })
        .collect())
}

#[tauri::command]
async fn upsert_tag(state: State<'_, AppState>, tag: Tag) -> Result<(), String> {
    let tag_name = normalize_tag_name(&tag.name).ok_or("Tag name cannot be empty")?;

    sqlx::query(
        r#"
        INSERT INTO tags (name, created_at)
        VALUES (?1, ?2)
        ON CONFLICT(name) DO NOTHING
        "#,
    )
    .bind(tag_name)
    .bind(tag.created_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("unsupported url scheme".to_string());
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "start", "", &url]);
        cmd
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(&url);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&url);
        cmd
    };

    command.spawn().map_err(|e| e.to_string())?;
    Ok(())
}

fn toggle_main_window(app: &AppHandle) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window("main") else {
        return Ok(());
    };

    if window.is_visible()? {
        window.hide()?;
    } else {
        window.unminimize()?;
        window.show()?;
        window.set_focus()?;
    }

    Ok(())
}

pub fn create_builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = toggle_main_window(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            tauri::async_runtime::block_on(async {
                let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
                fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;

                let db_path = app_data_dir.join("snippetbutler.db");
                let connect_options = SqliteConnectOptions::new()
                    .filename(&db_path)
                    .create_if_missing(true);

                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect_with(connect_options)
                    .await
                    .map_err(|e| e.to_string())?;

                sqlx::query(
                    r#"
                    CREATE TABLE IF NOT EXISTS folders (
                      id TEXT PRIMARY KEY,
                      name TEXT NOT NULL,
                      created_at INTEGER NOT NULL
                    )
                    "#,
                )
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;

                sqlx::query(
                    r#"
                    CREATE TABLE IF NOT EXISTS snippets (
                      id TEXT PRIMARY KEY,
                      content TEXT NOT NULL,
                      tags TEXT NOT NULL,
                      folder_id TEXT,
                      is_pinned INTEGER NOT NULL DEFAULT 0,
                      is_favorite INTEGER NOT NULL DEFAULT 0,
                      is_todo INTEGER NOT NULL DEFAULT 0,
                      is_done INTEGER NOT NULL DEFAULT 0,
                      is_archived INTEGER NOT NULL DEFAULT 0,
                      created_at INTEGER NOT NULL,
                      updated_at INTEGER NOT NULL,
                      FOREIGN KEY(folder_id) REFERENCES folders(id)
                    )
                    "#,
                )
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;

                sqlx::query(
                    r#"
                    CREATE TABLE IF NOT EXISTS tags (
                      name TEXT PRIMARY KEY,
                      created_at INTEGER NOT NULL
                    )
                    "#,
                )
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;

                seed_tags_from_existing_snippets(&pool).await?;

                app.manage(AppState { pool });
                Ok::<(), String>(())
            })?;

            let toggle_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyP);
            app.global_shortcut()
                .register(toggle_shortcut)
                .map_err(|e| e.to_string())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_snippets,
            upsert_snippet,
            delete_snippet,
            list_folders,
            upsert_folder,
            delete_folder,
            list_tags,
            upsert_tag,
            open_external_url
        ])
}
