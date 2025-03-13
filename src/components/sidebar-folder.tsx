import { Note, NoteSchema } from '@/App';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useState } from 'react';
import { z } from 'zod';

export function SidebarFolder({
  path,
  folderName,
  deepth,
}: {
  path?: String;
  folderName?: String; // for rendering
  deepth?: number; // for indenting the files
}) {
  const folderSchema = z.object({
    notes: NoteSchema.array(),
    subFolders: z.string().array(),
  });

  const store = new LazyStore('settings.json');
  const [notes, setNotes] = useState<Note[]>([]);
  const [subFolders, setSubFolders] = useState<String[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  async function getFolder() {
    try {
      const vaultPath = await store.get<{ value: String }>('notesVault');
      const dir = path ?? vaultPath;

      const res = await invoke('load_dir', { dir, vaultPath });
      const parsedRes = folderSchema.safeParse(res);

      if (parsedRes.success === true) {
        setNotes(
          parsedRes.data.notes.sort((a, b) => a.title.localeCompare(b.title))
        );
        setSubFolders(parsedRes.data.subFolders.sort());
        console.log(parsedRes.data.subFolders.sort());
      } else {
        console.log('Error: ', parsedRes.error);
      }
    } catch (error) {
      console.error('Failed to load folder:', error);
    } finally {
      setIsLoaded(true);
    }
  }

  const toggleFolder = () => {
    if (!isLoaded) {
      getFolder();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <button onClick={toggleFolder}>{folderName || 'vault'}</button>
      {isOpen && (subFolders.length || notes.length) && (
        <ul>
          {subFolders.map((subFolder, i) => (
            <SidebarFolder key={subFolder + i.toString()} path={subFolder} />
          ))}
          {notes.map((note, i) => (
            <li key={note.path + i.toString()}>{note.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
