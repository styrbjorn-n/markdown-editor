import { Note, NoteSchema } from '@/App';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export function SidebarFolder({
  path,
  folderName,
  deepth,
}: {
  path?: String;
  folderName?: string; // for rendering
  deepth?: number; // for indenting the files
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
        setSubFolders(
          parsedRes.data.subFolders.sort((a, b) =>
            a.folderName.localeCompare(b.folderName)
          )
        );
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
    <div className="w-full overflow-x-clip ">
      <button onClick={toggleFolder}>
        {isOpen ? 'v' : '>'} {folderName || 'vault'}
      </button>
      {isOpen && (subFolders.length || notes.length) && (
        <ul className="ml-4">
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
            <li key={note.path + i.toString()}>{note.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
