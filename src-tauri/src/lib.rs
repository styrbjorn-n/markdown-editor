use std::fs::{self, File};

use utils::get_notes_location;

mod utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn new_md(new_file_name: &str) {
    let new_note_loaction = get_notes_location();

    File::create(new_note_loaction + new_file_name + ".md").expect("failed to create new note");
}

#[tauri::command]
fn read_file(filename: &str) -> String {
    println!("trying to read file");
    let file_location = get_notes_location();
    if let Ok(contents) = fs::read_to_string(file_location + filename + ".md") {
        println!("file loaded");
        return contents;
    } else {
        println!("file failed to load");
        return "".to_string();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, new_md, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
