use std::fs::{self, File};

use serde::Serialize;
use utils::get_notes_location;

mod utils;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Note {
    title: String,
    path: String,
    content: String,
}

#[tauri::command]
fn new_md(new_file_name: &str) {
    let new_note_loaction = get_notes_location();

    File::create(new_note_loaction + new_file_name + ".md").expect("failed to create new note");
}

#[tauri::command]
fn read_file(filename: &str) -> Note {
    println!("trying to read file");
    let file_location = get_notes_location();
    if let Ok(contents) = fs::read_to_string(file_location.clone() + filename + ".md") {
        println!("file loaded");
        let new_note = Note {
            title: filename.to_string(),
            path: file_location + filename + ".md",
            content: contents,
        };
        println!("{:#?}", new_note);
        return new_note;
    } else {
        println!("file failed to load");
        let new_note = Note {
            title: "".to_string(),
            path: file_location,
            content: "".to_string(),
        };
        println!("{:#?}", new_note);
        return new_note;
    }
}

#[tauri::command]
fn save_file(note: Note) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![new_md, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
