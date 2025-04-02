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

export default function SidebarFile({ note }: { note: Note }) {
  const { setNewNote } = useNoteContext();

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
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
}
