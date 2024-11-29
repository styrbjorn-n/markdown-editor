use serde::{Deserialize, Serialize};
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::process::exit;
use std::{env, fs};

#[derive(Serialize)]
struct NewSettings {
    notes_loaction: String,
}

#[derive(Deserialize)]
struct Settings {
    notes_loaction: String,
}

// todo split settings creation from setting notes location
pub fn set_notes_location(new_loaction: String) -> std::io::Result<()> {
    let mut notes_location = new_loaction;
    notes_location.push_str("settings.json");
    if !Path::new(&notes_location).exists() {
        println!("creating settings file");
        File::create(&notes_location).expect("failed to create settings file");
    }

    let new_settings = NewSettings {
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
            .open(notes_location)?;

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
    working_path.push_str("/settings.json");

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
