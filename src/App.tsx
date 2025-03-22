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

  async function readFile(filePath: string) {
    const { data: res, error } = await tryCatch(
      invoke('read_file', { filePath })
    );
    if (error) {
      console.error(error);
      setFailedToRead(true);
      return;
    }

    const parsedRes = NoteSchema.parse(res);
    setNote({ ...parsedRes });

    if (textAreaRef.current) {
      textAreaRef.current.value = parsedRes.content;
      setFailedToRead(false);
    }
  }

  // TODO: Add error handling if file fails to save
  async function saveFile(note: Note) {
    await invoke('save_file', { note });
    console.log(note.title + ' saved');
  }

  async function loadFirstFile() {
    const vaultPath = await store.get<{ value: String }>('notesVault');
    const firstFile = vaultPath + '/' + 'welcome.md';
    readFile(firstFile);
  }

  // TODO: reduce useEffect spam
  useEffect(() => {
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
