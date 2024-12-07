// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use ::std::env;
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
};

use utils::{create_settings, get_notes_location, set_notes_location};
mod utils;

fn main() {
    let mut working_path = env::current_dir()
        .expect("could not get path")
        .into_os_string()
        .into_string()
        .unwrap();
    working_path.truncate(working_path.len() - "src-tauri".len());
    working_path.push_str("My Notes");

    if !Path::new(&working_path).exists() {
        fs::create_dir(working_path.clone()).expect("Failed to create My Notes");
        let mut first_file =
            File::create(working_path + "/welcome.md").expect("Failed to create welcome file");
        first_file
            .write("hello world".as_bytes())
            .expect("Failed to write to file");
        let working_path = env::current_dir()
            .expect("could not get path")
            .into_os_string()
            .into_string()
            .unwrap();
        create_settings();

        let mut notes_path = working_path.clone();
        notes_path.truncate(notes_path.len() - "src-tauri".len());
        notes_path.push_str("My Notes/");
        let _ = set_notes_location(notes_path);
    }

    println!("{}", get_notes_location());

    markdown_editor_lib::run()
}
