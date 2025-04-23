import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Note } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { SidebarFolder } from './sidebar-folder';
import { useSettingsContext } from '@/context/settingsContext';
import { FilePlus, FolderPlus } from 'lucide-react';
import { SidebarContext } from '@/context/sidebarContext';
import SettingsDialog from './settings/settings-dialog';

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isNewDirOpen, setIsNewDirOpen] = useState(false);
  const [event, setEvent] = useState(false);
  const { setNewNote } = useNoteContext();
  const { settings } = useSettingsContext();
  const inputRef = useRef<HTMLInputElement>(null);

  async function newMd(newFileName: string) {
    const folderPath = settings.notesVault;

    const newMd: Note = await invoke('new_md', { newFileName, folderPath });
    console.log('New file: ', newMd);

    setNewNote(newMd);
    setIsNewFileOpen(false);
    setNewFileName('');
    setEvent(true);
  }

  async function newDir(newDirName: string) {
    const parentDirPath = settings.notesVault;
    console.log('new dir name: ', newDirName);
    await invoke('new_dir', { newDirName, parentDirPath });
    setIsNewDirOpen(false);
    setNewDirectoryName('');
    setEvent(true);
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNewDirOpen, isNewFileOpen]);

  useEffect(() => {
    if (event === true) {
      setTimeout(() => {
        setEvent(false);
      }, 1000);
    }
  }, [event]);

  return (
    <Sidebar>
      <SidebarContext.Provider value={{ event, setEvent }}>
        <SidebarContent className="p-4">
          <div className="flex gap-1 items-center">
            <Button
              variant={'ghost'}
              size={'sm'}
              onClick={() => setIsNewFileOpen(true)}
              // className="h-6 w-6 hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            <Button
              variant={'ghost'}
              size={'sm'}
              onClick={() => setIsNewDirOpen(true)}
              // className="h-6 w-6 hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          {isNewDirOpen && (
            <form onSubmit={() => newDir(newDirectoryName)}>
              <input
                type="text"
                ref={inputRef}
                className="bg-transparent"
                value={newDirectoryName}
                onChange={(e) => setNewDirectoryName(e.target.value)}
                onBlur={() => {
                  setIsNewDirOpen(false);
                  setNewDirectoryName('');
                }}
              />
            </form>
          )}
          <SidebarFolder />
          {isNewFileOpen && (
            <form onSubmit={() => newMd(newFileName)}>
              <input
                type="text"
                ref={inputRef}
                className="bg-transparent"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => {
                  setIsNewFileOpen(false);
                  setNewFileName('');
                }}
              />
            </form>
          )}
        </SidebarContent>
        <SidebarFooter>
          <p>
            {settings.notesVault.slice(
              settings.notesVault.lastIndexOf('/') + 1
            )}
          </p>
          <SettingsDialog />
        </SidebarFooter>
      </SidebarContext.Provider>
    </Sidebar>
  );
}
