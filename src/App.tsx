import './App.css';
import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Textarea } from './components/ui/textarea';
import { LazyStore } from '@tauri-apps/plugin-store';
import useDebounce from './hooks/use-debounce';
import { z } from 'zod';
import { SearchDialog } from './components/search-dialog';
import { NoteContext } from './context/noteContext';
import { AppSidebar } from './components/app-sidebar';
import { tryCatch } from './lib/try-catch';

export const NoteSchema = z.object({
  title: z.string(),
  path: z.string(),
  content: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

function App() {
  const store = new LazyStore('settings.json');
  const [note, setNote] = useState<Note>();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [newNote, setNewNote] = useState<Note>();
  const [failedToRead, setFailedToRead] = useState(false);
  const isFirstRender = useRef(true);
  const [content, setContent] = useState('');
  let debouncedContent = useDebounce(content);

  async function getAllSettings() {
    const store = new LazyStore('settings.json');
    const settings = await store.entries();
    const sObject = Object.fromEntries(settings);
    console.log(sObject);
  }

  async function readFile(filePath: string) {
    console.log('filePath', filePath);

    const { data: opendNotes, error: opendNotesError } = await tryCatch(
      store.get<{ value: string[] }>('lastNotesOpend')
    );
    const { data: readRes, error: readError } = await tryCatch(
      invoke('read_file', { filePath })
    );
    if (readError) {
      console.error(readError);
      setFailedToRead(true);
      return;
    }
    if (opendNotesError) {
      console.error(readError);
      return;
    }

    console.log(opendNotes);

    const parsedReadRes = NoteSchema.parse(readRes);
    const parsedOpenedNotes = z.array(z.string()).parse(opendNotes);

    if (textAreaRef.current) {
      textAreaRef.current.value = parsedReadRes.content;
      setFailedToRead(false);
      setNote({ ...parsedReadRes });
      if (parsedOpenedNotes[0] !== parsedReadRes.path) {
        console.log('storing new setting');
        await store.set('lastNotesOpend', [
          parsedReadRes.path,
          ...parsedOpenedNotes,
        ]);
        await store.save();
      } else if (parsedOpenedNotes.includes(parsedReadRes.path)) {
        // this entire else if is ass and should be redone
        const newArray = [parsedReadRes.path, ...parsedOpenedNotes];
        const s = new Set(newArray);
        const newValue = [...s];
        if (newValue.length > 15) {
          const trimmedNewValue = newValue.slice(14);
          await store.set('lastNotesOpend', trimmedNewValue);
          return;
        }
        await store.set('lastNotesOpend', {
          value: [...s],
        });
      }
    }
  }

  // TODO: Add error handling if file fails to save
  async function saveFile(note: Note) {
    await invoke('save_file', { note });
    console.log(note.title + ' saved');
  }

  async function loadFirstFile() {
    const vaultPath = await store.get<{ value: string }>('notesVault');
    const lastNotesOpend = await store.get<{ value: string[] }>(
      'lastNotesOpend'
    );
    if (!lastNotesOpend?.value) {
      const firstFile = vaultPath + '/' + 'welcome.md';
      readFile(firstFile);
      return;
    }
    console.log('notesArray: ', lastNotesOpend.value);

    readFile(lastNotesOpend.value[0]);
    // leaving this if the last loaded breaks again
    // const firstFile = vaultPath + '/' + 'welcome.md';
    // await store.set('lastNotesOpend', { value: [firstFile] });
  }

  // TODO: reduce useEffect spam
  useEffect(() => {
    getAllSettings();
    loadFirstFile();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }
    console.log('debounce effect triggerd');

    if (!note) {
      console.log('no notes open');
    } else if (note.title !== '') {
      console.log('debounce note found');
      const updatenNote = { ...note, content: debouncedContent };
      saveFile(updatenNote);
    }
  }, [debouncedContent]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    if (newNote && note) {
      console.log('new note:', newNote);
      const updatenNote = {
        ...note,
        content: textAreaRef.current?.value || '',
      };
      if (!failedToRead) {
        saveFile(updatenNote);
      }
      readFile(newNote.path);
    }
  }, [newNote]);

  return (
    <NoteContext.Provider value={{ note, setNote, newNote, setNewNote }}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className=" relative h-full w-full shrink flex flex-col item ">
            <SidebarTrigger />
            <SearchDialog />
            <div className="w-full h-full flex justify-center ">
              <div
                className="w-full h-full max-w-[600px] relative mx-8
        mb-4 border-t "
              >
                <p className="absolute top-[-1.5rem]  font-thin left-0">
                  {note?.title
                    ? note.title.slice(note.title.lastIndexOf('/') + 1)
                    : 'filename'}
                </p>
                <Textarea
                  className="resize-none"
                  ref={textAreaRef}
                  defaultValue={note?.content}
                  onChange={(e) => {
                    if (textAreaRef.current) {
                      console.log('trying to update the debounce');
                      setContent(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </NoteContext.Provider>
  );
}

export default App;
