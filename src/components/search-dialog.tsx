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
import { Button } from './ui/button';
import { useNoteContext } from '@/context/noteContext';

export function SearchDialog() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRes, setSearchRes] = useState<Note[]>();
  const { setNewNote } = useNoteContext();

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
  }

  function handleClick(noteName: Note) {
    setNewNote(noteName);
    handleclose();
  }

  useEffect(() => {
    getSearchRes(searchTerm);
  }, [searchTerm, isSearchOpen]);

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
        <ol className="overflow-y-scroll">
          {searchRes?.map((n) => (
            <li key={n.title + n.path}>
              <Button
                variant="ghost"
                onClick={() => handleClick(n)}
                className="py-0 flex items-center gap-2 px-3 rounded w-full justify-start"
              >
                {n.title.includes('/')
                  ? n.title.slice(n.title.lastIndexOf('/') + 1)
                  : n.title}

                {n.title.includes('/') ? (
                  <>
                    <span className="opacity-45">-</span>
                    <p className="opacity-45 text-sm">
                      {n.title
                        .slice(0, n.title.lastIndexOf('/'))
                        .replace(/\//g, ' / ')}
                    </p>
                  </>
                ) : (
                  ''
                )}
              </Button>
            </li>
          ))}
        </ol>
      </DialogContent>
      <DialogFooter>{}</DialogFooter>
    </Dialog>
  );
}
