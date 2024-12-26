import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useEffect, useState } from 'react';
import { useOpenSearch } from '@/hooks/use-open-search';
import { Note, NoteSchema } from '@/App';
import { Input } from './ui/input';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

export function SearchDialog() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRes, setSearchRes] = useState<Note[]>();

  function toggleSearch(): void {
    setIsSearchOpen((prev) => !prev);
  }

  async function getSearchRes(searchTerm: String) {
    const store = new LazyStore('settings.json');
    const vaultPath = await store.get<{ value: String }>('notesVault');

    const res = await invoke('get_search_res', { searchTerm, vaultPath });
    const parsedRes = NoteSchema.array().safeParse(res);
    if (parsedRes.success) {
      setSearchRes(parsedRes.data);
    } else {
      console.log(parsedRes.error);
    }
  }

  function handleclose() {
    setIsSearchOpen(false);
    setSearchTerm('');
    setSearchTerm('');
  }

  useEffect(() => {
    getSearchRes(searchTerm);
  }, [searchTerm]);

  useOpenSearch({ isSearchOpen, toggleSearch });
  return (
    <Dialog open={isSearchOpen} onOpenChange={handleclose}>
      <DialogContent className="h-1/2 flex flex-col">
        <DialogHeader>
          <DialogTitle>Find note</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Note name"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
        <ol>
          {searchRes?.map((n) => (
            <li>{n.title}</li>
          ))}
        </ol>
      </DialogContent>
      <DialogFooter>{}</DialogFooter>
    </Dialog>
  );
}
