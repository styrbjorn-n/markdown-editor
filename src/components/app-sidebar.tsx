import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
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

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);

  async function newMd(newFileName: String) {
    await invoke('new_md', { newFileName });
    setIsNewFileOpen(false);
    setNewFileName('');
  }
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
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
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
