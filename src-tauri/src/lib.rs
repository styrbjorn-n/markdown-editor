use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{
    env,
    fs::{self, File},
    path::Path,
};
use tauri_plugin_store::StoreExt;
use utils::visit_dirs;
mod utils;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Note {
    title: String,
    path: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Folder {
    notes: Vec<Note>,
    sub_folders: Vec<Folder>,
}

#[tauri::command]
fn new_md(new_file_name: &str, vault_path: String) -> Note {
    let new_file: String = vault_path.clone() + "/" + &new_file_name + ".md";
    File::create(&new_file).expect("failed to create new note");

    let new_note = Note {
        title: new_file_name.to_string(),
        path: new_file.to_string(),
        content: "".to_string(),
    };
    return new_note;
}

#[tauri::command]
fn read_file(filename: &str, vault_path: String) -> Note {
    if let Ok(contents) = fs::read_to_string(vault_path.clone() + "/" + filename + ".md") {
        let new_note = Note {
            title: filename.to_string(),
            path: vault_path + "/" + filename + ".md",
            content: contents,
        };
        return new_note;
    } else {
        println!("file failed to load");
        let new_note = Note {
            title: "".to_string(),
            path: vault_path,
            content: "".to_string(),
        };
        return new_note;
    }
}

#[tauri::command]
fn save_file(note: Note) {
    fs::write(note.path, note.content).expect("failed to write to file")
}

#[tauri::command]
fn get_vault_view(vault_path: String) -> Vec<Note> {
    let mut vault_tree: Vec<Note> = Vec::new();
    let to_replace = vault_path.clone() + "/";
    let dir = Path::new(&vault_path);
    visit_dirs(&dir, &mut |entry| {
        let mut note_title = entry.path().display().to_string();
        note_title = note_title
            .replace(".md", "")
            .replace(to_replace.as_str(), "");
        vault_tree.push(Note {
            title: note_title,
            path: entry.path().display().to_string(),
            content: "".to_string(),
        });
    })
    .unwrap();
    vault_tree.sort_by_key(|note| note.title.matches('/').count());

    vault_tree
}

// fn load_dir(dir: &Path) -> Folder {
// let paths = fs::read_dir(dir).unwrap();
// let mut dir: Folder;

// for path in paths {
// println!("Name: {}", path.unwrap().path().display())
// }
// }

#[tauri::command]
fn get_search_res(search_term: String, vault_path: String) -> Vec<Note> {
    let mut vault_tree: Vec<Note> = Vec::new();
    let to_replace = vault_path.clone() + "/";
    let dir = Path::new(&vault_path);
    visit_dirs(&dir, &mut |entry| {
        let mut note_title = entry.path().display().to_string();
        note_title = note_title
            .replace(".md", "")
            .replace(to_replace.as_str(), "");
        vault_tree.push(Note {
            title: note_title,
            path: entry.path().display().to_string(),
            content: "".to_string(),
        });
    })
    .unwrap();
    return vault_tree;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = app.store("settings.json")?;
            let notes_vault = store.get("notesVault");

            match notes_vault {
                None => {
                    let mut working_path = env::current_dir()
                        .expect("could not get path")
                        .into_os_string()
                        .into_string()
                        .unwrap();
                    working_path.truncate(working_path.len() - "src-tauri".len());
                    working_path.push_str("My Notes");

                    store.set("notesVault".to_string(), json!(working_path));
                }
                _ => {
                    println!("Vault exists");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            new_md,
            read_file,
            save_file,
            get_search_res,
            get_vault_view
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
