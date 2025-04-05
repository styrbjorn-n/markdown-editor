use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{
    env,
    fs::{self, File},
    path::Path,
};
use tauri_plugin_store::StoreExt;
use utils::{levenshtein_distance, visit_dirs};
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
struct SubFolder {
    folder_name: String,
    folder_path: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Folder {
    notes: Vec<Note>,
    sub_folders: Vec<SubFolder>,
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
fn new_dir(new_dir_name: &str, vault_path: String) {
    let new_dir_path = vault_path + "/" + new_dir_name;
    println!("{}", new_dir_path);
    fs::create_dir(new_dir_path).expect("Failed to create new dir");
}

#[tauri::command]
fn read_file(file_path: &str) -> Note {
    let clean_file_name = file_path.rsplitn(2, "/").next().unwrap().replace(".md", "");
    // println!("{}", file_path);

    match fs::read_to_string(&file_path) {
        Ok(contents) => Note {
            title: clean_file_name.to_string(),
            path: file_path.to_string(),
            content: contents,
        },
        Err(err) => {
            println!("the file failed to load: {}", err);
            Note {
                title: "".to_string(),
                path: "".to_string(),
                content: "".to_string(),
            }
        }
    }
}

#[tauri::command]
fn save_file(note: Note) {
    fs::write(note.path, note.content).expect("failed to write to file")
}

#[tauri::command]
fn load_dir(dir: &Path) -> Folder {
    let paths = fs::read_dir(dir).unwrap();
    let mut folder: Folder = Folder {
        notes: Vec::new(),
        sub_folders: Vec::new(),
    };

    for path in paths {
        let entry = path.expect("Could not get entry");
        let file_type = entry.file_type().expect("could not get file type");
        let to_replace = dir.display().to_string().as_str().to_owned() + "/";

        if file_type.is_dir() {
            let sub_folder = SubFolder {
                folder_path: entry.path().display().to_string(),
                folder_name: entry
                    .path()
                    .display()
                    .to_string()
                    .replace(to_replace.as_str(), ""),
            };
            folder.sub_folders.push(sub_folder);
        } else if file_type.is_file() {
            let file_path = entry.path().display().to_string();
            let note = read_file(file_path.as_str());
            folder.notes.push(note);
        }
    }

    folder
}

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

    vault_tree.sort_by(|a, b| {
        let dist_a = levenshtein_distance(&a.title.to_lowercase(), &search_term.to_lowercase());
        let dist_b = levenshtein_distance(&b.title.to_lowercase(), &search_term.to_lowercase());

        dist_a
            .partial_cmp(&dist_b)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    return vault_tree;
}

#[tauri::command]
fn rename_file(file_path: String, new_name: String) {
    println!("{}", file_path);
    if !Path::new(&file_path).exists() {
        return;
    }

    let og_file_contents =
        fs::read_to_string(&file_path).expect("failed to load file contents for renaming"); // this is were it fails to read the file

    let new_path = file_path.rsplitn(2, "/").nth(1).unwrap_or("");

    if new_path != "" {
        let new_full_path = format!("{}/{}.md", new_path, new_name);
        File::create(&new_full_path).expect("failed to create new file when renaming");
        fs::write(new_full_path, og_file_contents)
            .expect("failed to write to new file when renaming");
        fs::remove_file(file_path).expect("failed to remove old file when renaming");
    }
}

#[tauri::command]
fn delete_file(file_path: String) {
    fs::remove_file(file_path).expect("failed to remove file")
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
            new_dir,
            read_file,
            save_file,
            get_search_res,
            load_dir,
            rename_file,
            delete_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
