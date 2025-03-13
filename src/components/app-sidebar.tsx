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
import { LazyStore } from '@tauri-apps/plugin-store';
import { Note, NoteSchema } from '@/App';
import { useNoteContext } from '@/context/noteContext';
import { SidebarFolder } from './sidebar-folder';

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [Vault, setVault] = useState<Note[]>();
  const { setNewNote } = useNoteContext();

  async function newMd(newFileName: String) {
    const store = new LazyStore('settings.json');
    const vaultPath = await store.get<{ value: String }>('notesVault');

    const newMd: Note = await invoke('new_md', { newFileName, vaultPath });
    console.log('New file: ', newMd);

    setNewNote(newMd);
    setIsNewFileOpen(false);
    setNewFileName('');
    getVault();
  }

  async function getVault() {
    const store = new LazyStore('settings.json');
    const vaultPath = await store.get<{ value: String }>('notesVault');
    const res = await invoke('get_vault_view', { vaultPath });
    const parsedRes = NoteSchema.array().safeParse(res);
    if (parsedRes.success) {
      setVault(parsedRes.data);
      // console.log('vault yoiked');
      // parsedRes.data.forEach((note) => {
      // console.log(note.title);
      // });
    } else {
      console.log(parsedRes.error);
    }
  }

  useEffect(() => {
    if (!Vault) {
      getVault();
    }
  }, [Vault]);

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
        {/* shit goes here */}
        <SidebarFolder />
      </SidebarContent>
    </Sidebar>
  );
}
