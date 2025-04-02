import { Note, NoteSchema } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { tryCatch } from '@/lib/try-catch';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import SidebarFile from './sidebar-file';

export function SidebarFolder({
  path,
  folderName,
}: {
  path?: String;
  folderName?: string;
}) {
  const subFolderSchema = z.object({
    folderPath: z.string(),
    folderName: z.string(),
  });
  const folderSchema = z.object({
    notes: NoteSchema.array(),
    subFolders: subFolderSchema.array(),
  });
  type SubFolder = z.infer<typeof subFolderSchema>;

  const store = new LazyStore('settings.json');
  const [notes, setNotes] = useState<Note[]>([]);
  const [subFolders, setSubFolders] = useState<SubFolder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setNewNote } = useNoteContext();

  async function getFolder() {
    const vaultPath = await store.get<{ value: String }>('notesVault');

    const dir = path ?? vaultPath;

    const { data: folderData, error } = await tryCatch(
      invoke('load_dir', { dir })
    );

    if (error) {
      console.error(error);
      return;
    }

    const parsedFolderData = folderSchema.parse(folderData);
    setNotes(
      parsedFolderData.notes.sort((a, b) => a.title.localeCompare(b.title))
    );
    setSubFolders(
      parsedFolderData.subFolders.sort((a, b) =>
        a.folderName.localeCompare(b.folderName)
      )
    );
    setIsLoaded(true);
  }

  const toggleFolder = () => {
    if (!isLoaded) {
      getFolder();
    } else {
      setIsLoaded(false);
      setNotes([]);
      setSubFolders([]);
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!path) {
      getFolder();
    }
  }, [path]);

  if (!path) {
    return (
      <div className="w-full overflow-x-clip ">
        {(subFolders.length || notes.length) && (
          <ul className="ml-3">
            {subFolders.map((subFolder, i) => {
              return (
                <SidebarFolder
                  key={subFolder.folderName + i.toString()}
                  path={subFolder.folderPath}
                  folderName={subFolder.folderName}
                />
              );
            })}
            {notes.map((note, i) => (
              <SidebarFile key={note.title + i} note={note}></SidebarFile>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-clip ">
      <button onClick={toggleFolder}>
        {isOpen ? (
          <span className="opacity-45">v </span>
        ) : (
          <span className="opacity-45">&gt; </span>
        )}
        {folderName}
      </button>
      {isOpen && (
        <ul className="ml-3">
          {subFolders.map((subFolder, i) => {
            return (
              <SidebarFolder
                key={subFolder.folderName + i.toString()}
                path={subFolder.folderPath}
                folderName={subFolder.folderName}
              />
            );
          })}
          {notes.map((note, i) => (
            <li key={note.path + i.toString()}>
              <button onClick={() => setNewNote(note)}>{note.title}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
