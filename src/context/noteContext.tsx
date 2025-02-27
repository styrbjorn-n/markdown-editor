import { Note } from '@/App';
import { createContext, useContext } from 'react';

export type NoteContextType = {
  note: Note | undefined;
  setNote: (n: Note) => void;
};

export const NoteContext = createContext<NoteContextType>({
  note: {
    title: '',
    content: '',
    path: '',
  },
  setNote: () => {},
});

export const useNoteContext = () => useContext(NoteContext);
