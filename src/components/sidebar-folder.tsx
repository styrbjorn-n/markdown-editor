import { Note, NoteSchema } from '@/App';
import { tryCatch } from '@/lib/try-catch';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useState } from 'react';
import { z } from 'zod';

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

  async function getFolder() {
    const vaultPath = await store.get<{ value: String }>('notesVault');

    const dir = path ?? vaultPath;

    const { data: folderData, error } = await tryCatch(
      invoke('load_dir', { dir, vaultPath })
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
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="w-full overflow-x-clip ">
      <button onClick={toggleFolder}>
        {isOpen ? 'v' : '>'} {folderName || 'vault'}
      </button>
      {isOpen && (subFolders.length || notes.length) && (
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
            <li key={note.path + i.toString()}>{note.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
