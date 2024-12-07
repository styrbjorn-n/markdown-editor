use std::fs::File;

use utils::get_notes_location;

mod utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn new_md(new_file_name: &str) {
    // add file creation logic here
    let new_note_loaction = get_notes_location();

    File::create(new_note_loaction + new_file_name + ".md").expect("failed to create new note");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, new_md])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
