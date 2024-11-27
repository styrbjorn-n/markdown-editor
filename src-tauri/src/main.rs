// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use ::std::env;
use std::fs;

fn main() {
    let working_path = env::current_dir()
        .expect("could not get path")
        .into_os_string()
        .into_string()
        .unwrap();

    if working_path.contains("Documents") {
        let docs_inde = working_path.find("Documents").unwrap();
        let docs_path = &working_path[..=docs_inde + "Documents".len()];

        let docs_files: Vec<String> = fs::read_dir(docs_path)
            .unwrap()
            .map(|e| e.unwrap().path().display().to_string())
            .collect();

        let notes_path = docs_path.to_string() + "My Notes";
        if !docs_files.contains(&notes_path) {
            fs::create_dir(notes_path).expect("failed to create my notes");
        }
    };

    markdown_editor_lib::run()
}
