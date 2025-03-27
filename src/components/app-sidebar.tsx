import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { invoke } from '@tauri-apps/api/core';

import { Input } from './ui/input';
import { useState } from 'react';
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
import { LazyStore } from '@tauri-apps/plugin-store';
import { Note } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { SidebarFolder } from './sidebar-folder';

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const { setNewNote } = useNoteContext();

  async function newMd(newFileName: string) {
    const store = new LazyStore('settings.json');
    const vaultPath = await store.get<{ value: string }>('notesVault');

    const newMd: Note = await invoke('new_md', { newFileName, vaultPath });
    console.log('New file: ', newMd);

    setNewNote(newMd);
    setIsNewFileOpen(false);
    setNewFileName('');
  }

  // this can wait. fix the exploding of data in welcome.md
  async function newDir(dirName: string) {
    const store = new LazyStore('settings.json');
    const vaultPath = await store.get<{ value: string }>('notesVault');
    console.log('new dir name: ', dirName);
    await invoke('new_dir', { dirName, vaultPath });
  }

  return (
    <Sidebar>
      <SidebarContent className="p-4">
        <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
          <DialogTrigger>new doc</DialogTrigger>
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
        <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
          <DialogTrigger>new dir</DialogTrigger>
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
        <SidebarFolder />
      </SidebarContent>
    </Sidebar>
  );
}
