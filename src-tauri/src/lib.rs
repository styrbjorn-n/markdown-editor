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
fn new_md(new_file_name: &str, folder_path: String) -> Note {
    // creates a new markdown file and returns the new file as a Note to the frontend

    let new_file: String = folder_path.clone() + "/" + &new_file_name + ".md";
    File::create(&new_file).expect("failed to create new note");

    let new_note = Note {
        title: new_file_name.to_string(),
        path: new_file.to_string(),
        content: "".to_string(),
    };
    return new_note;
}

#[tauri::command]
fn new_dir(new_dir_name: &str, parent_dir_path: String) {
    let new_dir_path = format!("{}/{}", parent_dir_path, new_dir_name);
    fs::create_dir(new_dir_path).expect("Failed to create new dir");
}

#[tauri::command]
fn read_file(file_path: &str, with_content_return: Option<bool>) -> Note {
    // reads the given file and returns it in Note format to the frontend
    // can opt in or out of getting the text content returned
    let clean_file_name = file_path.rsplitn(2, "/").next().unwrap().replace(".md", "");

    match fs::read_to_string(&file_path) {
        Ok(contents) => {
            let contents = if with_content_return.unwrap() {
                contents
            } else {
                "".to_string()
            };
            Note {
                title: clean_file_name.to_string(),
                path: file_path.to_string(),
                content: contents,
            }
        }
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
    // returns the files and folders inside the given folder
    // only called when clicking on the name of a folder or when a re render event is triggerd in the frontend

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
            let note = read_file(file_path.as_str(), Some(false));
            folder.notes.push(note);
        }
    }

    folder
}

#[tauri::command]
fn get_search_res(search_term: String, vault_path: String) -> Vec<Note> {
    // returns a array of all notes (markdown files) in the "vault" sorted based on their levenshtein distance

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
    // renames the a file based on the path provided and the new name.
    // copies the data from the first file before creating a new and writing said data to it before removing the original

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

#[tauri::command]
fn rename_folder(folder_path: String, new_name: String) {
    // gets all files form the folder about to be renamed in to a Vec ( array for dummies like me )
    // sorts them based on how many "/" each string has ( not really nessasary i think )
    // creates the folder with its new name at the same loaction
    // loops over all the file paths. reading thier contects, then creates the all the dirs missing from it desierd path
    // before creating the the file in its new loaction and writing the contents to it
    // when the loop is done removes the original folder and ALL FILES AND FOLDERS INSIDE OF IT

    if !Path::new(&folder_path).exists() || new_name == "" {
        return;
    }

    let new_base_path = format!(
        "{}/{}",
        folder_path.rsplitn(2, "/").nth(1).unwrap_or(""),
        new_name
    );

    let mut dir_tree: Vec<String> = Vec::new();
    let dir = Path::new(&folder_path);
    visit_dirs(&dir, &mut |entry| {
        dir_tree.push(entry.path().display().to_string());
    })
    .unwrap();

    dir_tree.sort_by_key(|s| s.matches("/").count());

    fs::create_dir(&new_base_path).expect("failed to create new dir for renaming");

    for path in dir_tree {
        let failed_to_read_message =
            format!("failed to read file before renaming folder: {}", &path);
        let path_content = fs::read_to_string(&path).expect(failed_to_read_message.as_str());

        let new_file_path = path.replace(&folder_path, &new_base_path);
        fs::create_dir_all(&new_file_path.rsplitn(2, "/").nth(1).unwrap_or(""))
            .expect("failed to create all folders before renaming folder");
        File::create(&new_file_path).expect("failed to create copy of file when renmaing folder");
        fs::write(new_file_path, path_content)
            .expect("failed to write to new file when renaming folder");
    }
    fs::remove_dir_all(folder_path).expect("failed to remove old dir when renaming folder");
}

#[tauri::command]
fn delete_folder(folder_path: String) {
    fs::remove_dir_all(folder_path).expect("failed to remove file")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // the main tauri run function ( dont really know how it works )
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = app.store("settings.json")?;
            let notes_vault = store.get("notesVault");

            match notes_vault {
                None => {
                    // this whole working path nonsens should be replaced with a selection / create new "vault" screen
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
            delete_file,
            rename_folder,
            delete_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
