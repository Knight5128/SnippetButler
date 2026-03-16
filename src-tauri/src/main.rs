#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    snippetbutler::create_builder()
        .run(tauri::generate_context!())
        .expect("error while running SnippetButler");
}
