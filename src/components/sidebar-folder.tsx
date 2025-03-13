import { Note, NoteSchema } from '@/App';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export function SidebarFolder({ path }: { path?: String }) {
  const folderSchema = z.object({
    notes: NoteSchema.array(),
    subFolders: z.string().array(),
  });

  const store = new LazyStore('settings.json');
  const [notes, setNotes] = useState<Note[]>([]);
  const [subFolders, setSubFolders] = useState<String[]>([]);
  let dir = path;

  async function getFolder() {
    const vaultPath = await store.get<{ value: String }>('notesVault');
    if (path === undefined || path === null) {
      //@ts-ignore
      //im not spending time on this type error
      dir = vaultPath;
    }
    const res = await invoke('load_dir', { dir, vaultPath });
    const parsedRes = folderSchema.safeParse(res);

    if (parsedRes.success === true) {
      setNotes(parsedRes.data.notes);
      setSubFolders(parsedRes.data.subFolders);
    } else {
      console.log('Error: ', parsedRes.error);
    }
  }

  useEffect(() => {
    getFolder();
  }, []);

  return (
    <ul>
      {subFolders.length > 0 ? (
        subFolders.map((subFolder, i) => (
          <li key={subFolder + i.toString()}>{subFolder}</li>
        ))
      ) : (
        <p>oof</p>
      )}
      {notes.length > 0 ? (
        notes.map((note, i) => (
          <li key={note.path + i.toString()}>{note.title}</li>
        ))
      ) : (
        <p>oof</p>
      )}
    </ul>
  );
}
