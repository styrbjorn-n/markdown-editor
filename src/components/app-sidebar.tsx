import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { invoke } from '@tauri-apps/api/core';

async function newMd() {
  await invoke('new_md');
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarMenuButton asChild>
          <Button onClick={() => newMd()}>asd</Button>
        </SidebarMenuButton>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
