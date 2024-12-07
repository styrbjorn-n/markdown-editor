import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { invoke } from '@tauri-apps/api/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Input } from './ui/input';
import { useState } from 'react';

export function AppSidebar() {
  const [newFileName, setNewFileName] = useState('');

  async function newMd(newFileName: String) {
    await invoke('new_md', { newFileName });

    setNewFileName('');
  }
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <AlertDialog>
          <AlertDialogTrigger>new doc</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>New Document</AlertDialogTitle>
            </AlertDialogHeader>
            <Input
              placeholder="Document Name"
              onChange={(event) => setNewFileName(event.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!newFileName}
                onClick={() => newMd(newFileName)}
              >
                Create File
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
