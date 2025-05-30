// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use ::std::env;
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
};

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
    }

    markdown_editor_lib::run()
}
