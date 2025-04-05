import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { invoke } from '@tauri-apps/api/core';
import { Input } from './ui/input';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Note } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { SidebarFolder } from './sidebar-folder';
import { useSettingsContext } from '@/context/settingsContext';
import { FilePlus, FolderPlus } from 'lucide-react';
import { SidebarContext } from '@/context/sidebarContext';

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isNewDirOpen, setIsNewDirOpen] = useState(false);
  const [event, setEvent] = useState(false);
  const { setNewNote } = useNoteContext();
  const { settings } = useSettingsContext();

  async function newMd(newFileName: string) {
    const vaultPath = settings.notesVault;

    const newMd: Note = await invoke('new_md', { newFileName, vaultPath });
    console.log('New file: ', newMd);

    setNewNote(newMd);
    setIsNewFileOpen(false);
    setNewFileName('');
    setEvent(true);
  }

  // this can wait. fix the exploding of data in welcome.md
  async function newDir(newDirName: string) {
    const vaultPath = settings.notesVault;
    console.log('new dir name: ', newDirName);
    await invoke('new_dir', { newDirName, vaultPath });
    setIsNewDirOpen(false);
    setNewDirectoryName('');
    setEvent(true);
  }

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
            <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
              <DialogTrigger className="h-6 w-6 hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded">
                <FilePlus className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Document</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Document Name"
                  onChange={(event) => setNewFileName(event.target.value)}
                  value={newFileName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFileName) {
                      newMd(newFileName);
                    }
                  }}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant={'secondary'}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={!newFileName}
                    onClick={() => newMd(newFileName)}
                  >
                    Create File
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isNewDirOpen} onOpenChange={setIsNewDirOpen}>
              <DialogTrigger className="h-6 w-6 hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded">
                <FolderPlus className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>new Directory</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Directory Name"
                  onChange={(event) => setNewDirectoryName(event.target.value)}
                  value={newDirectoryName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newDirectoryName) {
                      newDir(newDirectoryName);
                    }
                  }}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant={'secondary'}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={!newDirectoryName}
                    onClick={() => newDir(newDirectoryName)}
                  >
                    Create Directory
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarFolder />
        </SidebarContent>
      </SidebarContext.Provider>
    </Sidebar>
  );
}
