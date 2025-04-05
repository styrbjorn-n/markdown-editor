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
import { useSidebarContext } from '@/context/sidebarContext';
import { useEffect, useRef, useState } from 'react';

export default function SidebarFile({ note }: { note: Note }) {
  const [isrenameOpen, setIsRenameOpen] = useState(false);
  const [newFileName, setNewFileName] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setNewNote } = useNoteContext();
  const { setEvent } = useSidebarContext();

  const handleRename = async (filePath: string, newName: string) => {
    console.log('renaming file');

    await invoke('rename_file', { filePath, newName });
    setEvent(true);
    setIsRenameOpen(false);
  };

  const handleDelete = async (filePath: string) => {
    await invoke('delete_file', { filePath });
    setEvent(true);
  };

  const handleUnfocus = () => {
    setIsRenameOpen(false);
    setNewFileName(note.title);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isrenameOpen]);

  if (isrenameOpen) {
    return (
      <li>
        <form
          onSubmit={() => {
            handleRename(note.path, newFileName);
          }}
        >
          <input
            className="bg-transparent"
            ref={inputRef}
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => handleUnfocus()}
          />
        </form>
      </li>
    );
  }

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
          <ContextMenuItem onClick={() => setIsRenameOpen(true)}>
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
