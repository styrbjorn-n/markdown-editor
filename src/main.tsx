import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/theme-provider';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { LazyStore } from '@tauri-apps/plugin-store';
import { SearchDialog } from './components/search-dialog';

const store = new LazyStore('settings.json');
// await store.set('some-key', { value: 5 });

const notesVault = await store.get<{ value: String }>('notesVault');

if (!notesVault) {
  console.log('womp womp');
} else {
  console.log(notesVault);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <SearchDialog />
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <App />
        </main>
      </SidebarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
