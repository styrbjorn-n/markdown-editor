import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useState } from 'react';
import { useOpenSearch } from '@/hooks/use-open-search';
import { Note } from '@/App';
import { Input } from './ui/input';

export function SearchDialog() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRes, setSearchRes] = useState<Note[]>();

  function toggleSearch(): void {
    setIsSearchOpen((prev) => !prev);
  }

  useOpenSearch({ isSearchOpen, toggleSearch });
  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find note</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Note name"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      </DialogContent>
      <DialogFooter>{}</DialogFooter>
    </Dialog>
  );
}
