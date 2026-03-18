use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Row, SqlitePool,
};
use std::collections::HashMap;
use std::fs;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
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

#[derive(Debug, Serialize)]
pub struct ExportNotesResult {
    pub file_path: String,
    pub file_name: String,
    pub bytes: usize,
    pub snippet_count: usize,
    pub folder_count: usize,
    pub exported_at: i64,
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

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn format_note_title(content: &str) -> String {
    let candidate = content
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("Untitled note");
    let title: String = candidate.chars().take(48).collect();

    if candidate.chars().count() > 48 {
        format!("{title}...")
    } else {
        title
    }
}

fn localize(language: &str, en: &'static str, zh: &'static str, ja: &'static str) -> &'static str {
    match language {
        "zh-CN" => zh,
        "ja-JP" => ja,
        _ => en,
    }
}

fn build_badges(snippet: &Snippet, language: &str) -> String {
    let mut badges = Vec::new();

    if snippet.is_pinned {
        badges.push(localize(language, "Pinned", "置顶", "ピン留め"));
    }
    if snippet.is_favorite {
        badges.push(localize(language, "Favorite", "收藏", "お気に入り"));
    }
    if snippet.is_todo {
        badges.push(localize(language, "Todo", "待办", "ToDo"));
    }
    if snippet.is_done {
        badges.push(localize(language, "Done", "已完成", "完了"));
    }
    if snippet.is_archived {
        badges.push(localize(language, "Archived", "已归档", "アーカイブ済み"));
    }

    badges
        .into_iter()
        .map(|badge| {
            format!(
                r#"<span class="badge status">{}</span>"#,
                escape_html(badge)
            )
        })
        .collect::<Vec<_>>()
        .join("")
}

fn build_tags(tags: &str) -> String {
    tags.split(',')
        .map(str::trim)
        .filter(|tag| !tag.is_empty())
        .map(|tag| format!(r#"<span class="badge tag">#{}</span>"#, escape_html(tag)))
        .collect::<Vec<_>>()
        .join("")
}

fn build_export_html(snippets: &[Snippet], folders: &[Folder], language: &str) -> String {
    let folder_names = folders
        .iter()
        .map(|folder| (folder.id.clone(), folder.name.clone()))
        .collect::<HashMap<_, _>>();
    let archived_count = snippets.iter().filter(|snippet| snippet.is_archived).count();
    let favorite_count = snippets.iter().filter(|snippet| snippet.is_favorite).count();
    let todo_count = snippets.iter().filter(|snippet| snippet.is_todo).count();
    let uncategorized_label = localize(language, "Uncategorized", "未分组", "未分類");
    let generated_label = localize(language, "Generated", "导出时间", "生成日時");
    let notes_label = localize(language, "Notes", "笔记数", "ノート数");
    let folders_label = localize(language, "Folders", "文件夹数", "フォルダー数");
    let archived_label = localize(language, "Archived", "已归档", "アーカイブ");
    let favorites_label = localize(language, "Favorites", "收藏", "お気に入り");
    let todos_label = localize(language, "Todos", "待办", "ToDo");
    let export_title = localize(
        language,
        "SnippetButler Notes Export",
        "SnippetButler 笔记导出",
        "SnippetButler ノート書き出し",
    );
    let export_subtitle = localize(
        language,
        "A standalone HTML snapshot generated from your local notes.",
        "从本地笔记生成的离线 HTML 快照。",
        "ローカルノートから生成したスタンドアロン HTML スナップショットです。",
    );
    let note_cards = snippets
        .iter()
        .map(|snippet| {
            let folder_name = snippet
                .folder_id
                .as_ref()
                .and_then(|id| folder_names.get(id))
                .cloned()
                .unwrap_or_else(|| uncategorized_label.to_string());
            let title = format_note_title(&snippet.content);
            let content_html = escape_html(&snippet.content).replace('\n', "<br />");
            let tags_html = build_tags(&snippet.tags);
            let badges_html = build_badges(snippet, language);

            format!(
                r#"
                <article class="note-card">
                  <div class="note-top">
                    <div>
                      <h2>{}</h2>
                      <div class="meta-row">
                        <span class="meta">{}</span>
                        <span class="meta date" data-timestamp="{}"></span>
                      </div>
                    </div>
                    <div class="badge-row">{}{}</div>
                  </div>
                  <div class="note-content">{}</div>
                  <div class="meta-row">
                    <span class="meta date" data-timestamp="{}"></span>
                  </div>
                </article>
                "#,
                escape_html(&title),
                escape_html(&folder_name),
                snippet.created_at,
                badges_html,
                tags_html,
                content_html,
                snippet.updated_at
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"<!DOCTYPE html>
<html lang="{language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{export_title}</title>
    <style>
      :root {{
        color-scheme: light;
        --bg: #f6f8f5;
        --surface: #ffffff;
        --surface-soft: #f4f7f1;
        --text: #16211b;
        --muted: rgba(22, 33, 27, 0.58);
        --line: rgba(18, 24, 20, 0.08);
        --primary: #12b75b;
        --primary-soft: rgba(18, 183, 91, 0.12);
        --tag: rgba(18, 183, 91, 0.1);
      }}

      * {{
        box-sizing: border-box;
      }}

      body {{
        margin: 0;
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        background: var(--bg);
        color: var(--text);
      }}

      .page {{
        max-width: 1180px;
        margin: 0 auto;
        padding: 32px 24px 56px;
      }}

      .hero {{
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #ffffff 0%, #f9fcf7 100%);
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
      }}

      .hero h1 {{
        margin: 0;
        font-size: 32px;
        line-height: 1.2;
      }}

      .hero p {{
        margin: 14px 0 0;
        max-width: 720px;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.7;
      }}

      .stats {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 14px;
        margin-top: 22px;
      }}

      .stat-card {{
        border: 1px solid var(--line);
        background: var(--surface);
        border-radius: 22px;
        padding: 18px;
      }}

      .stat-card .label {{
        color: var(--muted);
        font-size: 14px;
      }}

      .stat-card .value {{
        margin-top: 10px;
        font-size: 28px;
        font-weight: 700;
      }}

      .notes {{
        display: grid;
        gap: 18px;
        margin-top: 24px;
      }}

      .note-card {{
        border: 1px solid var(--line);
        background: var(--surface);
        border-radius: 26px;
        padding: 22px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.025);
      }}

      .note-top {{
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-start;
      }}

      .note-card h2 {{
        margin: 0;
        font-size: 20px;
        line-height: 1.4;
      }}

      .meta-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }}

      .meta {{
        color: var(--muted);
        font-size: 13px;
      }}

      .badge-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }}

      .badge {{
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 600;
      }}

      .badge.status {{
        background: var(--primary-soft);
        color: var(--primary);
      }}

      .badge.tag {{
        background: var(--tag);
        color: var(--primary);
      }}

      .note-content {{
        margin-top: 16px;
        padding: 16px 18px;
        border-radius: 18px;
        background: var(--surface-soft);
        line-height: 1.75;
        white-space: normal;
        word-break: break-word;
      }}

      @media (max-width: 720px) {{
        .page {{
          padding: 20px 14px 40px;
        }}

        .hero,
        .note-card {{
          padding: 18px;
        }}

        .note-top {{
          flex-direction: column;
        }}

        .badge-row {{
          justify-content: flex-start;
        }}
      }}
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>{export_title}</h1>
        <p>{export_subtitle}</p>
        <div class="stats">
          <div class="stat-card">
            <div class="label">{generated_label}</div>
            <div class="value date" data-timestamp="{exported_at}"></div>
          </div>
          <div class="stat-card">
            <div class="label">{notes_label}</div>
            <div class="value">{notes_count}</div>
          </div>
          <div class="stat-card">
            <div class="label">{folders_label}</div>
            <div class="value">{folders_count}</div>
          </div>
          <div class="stat-card">
            <div class="label">{archived_label}</div>
            <div class="value">{archived_count}</div>
          </div>
          <div class="stat-card">
            <div class="label">{favorites_label}</div>
            <div class="value">{favorite_count}</div>
          </div>
          <div class="stat-card">
            <div class="label">{todos_label}</div>
            <div class="value">{todo_count}</div>
          </div>
        </div>
      </section>

      <section class="notes">
        {note_cards}
      </section>
    </main>

    <script>
      const formatter = new Intl.DateTimeFormat(undefined, {{
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }});

      document.querySelectorAll(".date").forEach((node) => {{
        const timestamp = Number(node.getAttribute("data-timestamp"));
        if (!Number.isFinite(timestamp)) return;
        node.textContent = formatter.format(timestamp);
      }});
    </script>
  </body>
</html>
"#,
        language = language,
        export_title = escape_html(export_title),
        export_subtitle = escape_html(export_subtitle),
        generated_label = escape_html(generated_label),
        notes_label = escape_html(notes_label),
        folders_label = escape_html(folders_label),
        archived_label = escape_html(archived_label),
        favorites_label = escape_html(favorites_label),
        todos_label = escape_html(todos_label),
        exported_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
        notes_count = snippets.len(),
        folders_count = folders.len(),
        archived_count = archived_count,
        favorite_count = favorite_count,
        todo_count = todo_count,
        note_cards = note_cards
    )
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

#[tauri::command]
async fn export_notes_as_html(
    app: AppHandle,
    state: State<'_, AppState>,
    language: String,
) -> Result<ExportNotesResult, String> {
    let snippet_rows = sqlx::query(
        r#"
        SELECT id, content, tags, folder_id,
               is_pinned, is_favorite, is_todo, is_done, is_archived,
               created_at, updated_at
        FROM snippets
        ORDER BY is_archived ASC, is_pinned DESC, created_at DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    let snippets = snippet_rows
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
        .collect::<Vec<_>>();

    let folder_rows = sqlx::query("SELECT id, name, created_at FROM folders ORDER BY created_at ASC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    let folders = folder_rows
        .into_iter()
        .map(|r| Folder {
            id: r.get("id"),
            name: r.get("name"),
            created_at: r.get("created_at"),
        })
        .collect::<Vec<_>>();

    let exported_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    let html = build_export_html(&snippets, &folders, &language);
    let file_name = format!(
        "snippetbutler-export-{}.html",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    );

    let export_dir = match app.path().download_dir() {
        Ok(path) => path,
        Err(_) => {
            let fallback = app
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?
                .join("exports");
            fs::create_dir_all(&fallback).map_err(|e| e.to_string())?;
            fallback
        }
    };
    fs::create_dir_all(&export_dir).map_err(|e| e.to_string())?;

    let file_path = export_dir.join(&file_name);
    fs::write(&file_path, html.as_bytes()).map_err(|e| e.to_string())?;

    Ok(ExportNotesResult {
        file_path: file_path.to_string_lossy().into_owned(),
        file_name,
        bytes: html.as_bytes().len(),
        snippet_count: snippets.len(),
        folder_count: folders.len(),
        exported_at,
    })
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
            open_external_url,
            export_notes_as_html
        ])
}
