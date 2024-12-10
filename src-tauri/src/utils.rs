use serde::{Deserialize, Serialize};
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::process::exit;
use std::{env, fs};
use tauri::Emitter;

#[derive(Serialize)]
struct NewSettings {
    notes_loaction: String,
}

#[derive(Deserialize)]
struct Settings {
    notes_loaction: String,
}

pub fn create_settings() {
    let mut settings_path = env::current_dir()
        .expect("could not get path")
        .into_os_string()
        .into_string()
        .unwrap();
    settings_path.truncate(settings_path.len() - "src-tauri".len());
    settings_path.push_str("settings.json");
    if !Path::new(&settings_path).exists() {
        println!("creating settings file");

        File::create(&settings_path).expect("failed to create settings file");
    }
}

pub fn set_notes_location(new_loaction: String) -> std::io::Result<()> {
    let mut settings_path = env::current_dir()
        .expect("could not get path")
        .into_os_string()
        .into_string()
        .unwrap();
    settings_path.truncate(settings_path.len() - "src-tauri".len());
    settings_path.push_str("settings.json");
    let notes_location = new_loaction;

    let new_settings: NewSettings = NewSettings {
        notes_loaction: notes_location.clone(),
    };

    let j = match serde_json::to_string(&new_settings) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("Unable to load data");
            exit(1);
        }
    };

    {
        let mut file = OpenOptions::new()
            .write(true)
            .truncate(true)
            .open(settings_path)?;

        file.write_all(j.as_bytes())?;
    }

    Ok(())
}

pub fn get_notes_location() -> String {
    let mut working_path = env::current_dir()
        .expect("could not get path")
        .into_os_string()
        .into_string()
        .unwrap();
    working_path.truncate(working_path.len() - "src-tauri".len());
    working_path.push_str("settings.json");

    let settings_data = fs::read_to_string(working_path).expect("Failed to read settings");
    let settings: Settings = match serde_json::from_str(&settings_data) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("Unable to load data");
            exit(1);
        }
    };
    settings.notes_loaction
}
