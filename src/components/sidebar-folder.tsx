import { Note, NoteSchema } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { tryCatch } from '@/lib/try-catch';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import SidebarFile from './sidebar-file';
import { useSidebarContext } from '@/context/sidebarContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { ContextMenuItem } from '@radix-ui/react-context-menu';
import { useSettingsContext } from '@/context/settingsContext';

export function SidebarFolder({
  path,
  folderName,
}: {
  path?: string;
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
  const { settings, setSettings } = useSettingsContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subFolders, setSubFolders] = useState<SubFolder[]>([]);
  const [isOpen, setIsOpen] = useState(
    checkOpened(path || '', settings.isFolderOpen)
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isrenameOpen, setIsRenameOpen] = useState(false);
  const [isNewDirOpen, setIsNewDirOpen] = useState(false);
  const [NewDir, setNewDir] = useState('');
  const [isNewMdOpen, setIsNewMdOpen] = useState(false);
  const [newMdName, setNewMdName] = useState('');
  const [newFolderName, setNewFolderName] = useState(folderName || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setNewNote } = useNoteContext();
  const { event, setEvent } = useSidebarContext();

  function checkOpened(path: string, openedPathArray: string[]) {
    if (openedPathArray.includes(path)) {
      return true;
    } else {
      return false;
    }
  }

  async function getFolder() {
    const vaultPath = await store.get<{ value: String }>('notesVault');

    const dir = path ?? vaultPath;
    console.log(dir);

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

    if (path !== undefined && path !== '') {
      const newIsFolderOpen = Array.from(
        new Set([path, ...settings.isFolderOpen])
      );
      store.set('isFolderOpen', newIsFolderOpen);
      store.save();
      setSettings((prevSettings) => ({
        ...prevSettings,
        isFolderOpen: newIsFolderOpen,
      }));
    }
  };

  const handleDelete = async (folderPath: string) => {
    //add check if there are folders or files in folder, if true
    //open "ARE YOU SURE" dialog, where user can decide if nuke or not
    await invoke('delete_folder', { folderPath });
    setEvent(true);
  };

  const handleRename = async (folderPath: string, newName: string) => {
    console.log('renaming folder');

    await invoke('rename_folder', { folderPath, newName });
    setEvent(true);
    setIsRenameOpen(false);
  };

  const handleUnfocus = () => {
    setIsRenameOpen(false);
    setNewFolderName(folderName || '');
    setIsNewMdOpen(false);
    setNewMdName('');
    setIsNewDirOpen(false);
    setNewDir('');
  };

  async function newMd(newFileName: string) {
    const folderPath = path;

    const newMd: Note = await invoke('new_md', { newFileName, folderPath });
    console.log('New file: ', newMd);

    setNewNote(newMd);
    setIsNewMdOpen(false);
    setNewMdName('');
    setEvent(true);
  }

  async function newDir(newDirName: string) {
    const parentDirPath = path;
    console.log('new dir name: ', newDirName);
    await invoke('new_dir', { newDirName, parentDirPath });
    setIsNewDirOpen(false);
    setNewDir('');
    setEvent(true);
  }

  useEffect(() => {
    if (isOpen) {
      getFolder();
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isrenameOpen, isNewMdOpen, isNewDirOpen]);

  useEffect(() => {
    if (!path) {
      getFolder();
    }
  }, [path]);

  useEffect(() => {
    if (event && isLoaded) {
      getFolder();
    }
  }, [event]);

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
              <SidebarFile key={note.title + i} note={note} />
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (isrenameOpen && path) {
    return (
      <div className="w-full overflow-x-clip">
        <div className="flex gap-1">
          {isOpen ? (
            <span className="opacity-45">v </span>
          ) : (
            <span className="opacity-45">&gt; </span>
          )}
          <form
            onSubmit={() => {
              handleRename(path, newFolderName);
            }}
          >
            <input
              className="bg-transparent"
              ref={inputRef}
              type="text"
              value={NewDir}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => handleUnfocus()}
            />
          </form>
        </div>
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
              <li key={note.path + i.toString()}>{note.title}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if ((isNewDirOpen || isNewMdOpen) && path) {
    return (
      <div className="w-full overflow-x-clip">
        <div className="flex gap-1">
          {isOpen ? (
            <span className="opacity-45">v </span>
          ) : (
            <span className="opacity-45">&gt; </span>
          )}
          {folderName}
        </div>
        <ul className="ml-3">
          {isNewDirOpen && (
            <form
              onSubmit={() => {
                newDir(newFolderName);
              }}
            >
              <input
                className="bg-transparent"
                ref={inputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewDir(e.target.value)}
                onBlur={() => handleUnfocus()}
              />
            </form>
          )}
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
          {isNewMdOpen && (
            <form
              onSubmit={() => {
                newMd(newMdName);
              }}
            >
              <input
                className="bg-transparent"
                ref={inputRef}
                type="text"
                value={newMdName}
                onChange={(e) => setNewMdName(e.target.value)}
                onBlur={() => handleUnfocus()}
              />
            </form>
          )}
        </ul>
      </div>
    );
  }

  return (
    <ContextMenu>
      <div className="w-full overflow-x-clip">
        <ContextMenuTrigger onClick={toggleFolder}>
          {isOpen ? (
            <span className="opacity-45">v </span>
          ) : (
            <span className="opacity-45">&gt; </span>
          )}
          {folderName}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>{folderName}</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setIsRenameOpen(true)}>
            rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleDelete(path)}>
            delete
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setIsNewDirOpen(true);
              setIsOpen(true);
              getFolder();
            }}
          >
            new folder
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setIsNewMdOpen(true);
              setIsOpen(true);
              getFolder();
            }}
          >
            new md
          </ContextMenuItem>
        </ContextMenuContent>
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
    </ContextMenu>
  );
}
