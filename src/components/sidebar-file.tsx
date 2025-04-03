import { Note } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { invoke } from '@tauri-apps/api/core';

export default function SidebarFile({ note }: { note: Note }) {
  const { setNewNote } = useNoteContext();

  const handleRename = async (filePath: string, newName: string) => {
    console.log('renaming file');

    // await invoke('rename_file', { filePath, newName });
  };

  const handleDelete = async (filePath: string) => {
    // re enable when reload on event is implemented
    // await invoke('delete_file', { filePath });
  };

  return (
    <li className="hover:cursor-pointer">
      <ContextMenu>
        <ContextMenuTrigger onClick={() => setNewNote(note)}>
          {note.title}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>{note.title}</ContextMenuLabel>
          <ContextMenuSeparator />
          {/* add the fucntions to rename and delete */}
          <ContextMenuItem onClick={() => handleRename(note.path, '')}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleDelete(note.path)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
}
