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
import {
  parseSettings,
  SettingsContext,
  SettingsType,
} from './context/settingsContext';

export const NoteSchema = z.object({
  title: z.string(),
  path: z.string(),
  content: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

const defaultSettings: SettingsType = {
  notesVault: '',
  lastNotesOpend: [],
};

function App() {
  const store = new LazyStore('settings.json');
  const [note, setNote] = useState<Note>();
  const [newNote, setNewNote] = useState<Note>();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [failedToRead, setFailedToRead] = useState(false);
  const isFirstRender = useRef(true);
  const [content, setContent] = useState('');
  let debouncedContent = useDebounce(content);

  async function readFile(filePath: string) {
    const lastNotesOpend = settings.lastNotesOpend;

    const { data: readRes, error: readError } = await tryCatch(
      invoke('read_file', { filePath })
    );
    if (readError) {
      console.error(readError);
      setFailedToRead(true);
      return;
    }
    const parsedReadRes = NoteSchema.parse(readRes);

    if (textAreaRef.current) {
      textAreaRef.current.value = parsedReadRes.content;
      setFailedToRead(false);
      setNote({ ...parsedReadRes });

      const newHistory = new Set([parsedReadRes.path, ...lastNotesOpend]);
      const limitedHistory = new Set([...newHistory].slice(0, 50));

      await store.set('lastNotesOpend', [...limitedHistory]);
      setSettings({ ...settings, lastNotesOpend: [...limitedHistory] });
    }
  }

  // TODO: Add error handling if file fails to save
  async function saveFile(note: Note) {
    await invoke('save_file', { note });
    // console.log(note.title + ' saved');
  }

  // TODO: reduce useEffect spam
  useEffect(() => {
    const loadAppConfig = async () => {
      const store = new LazyStore('settings.json');
      const settingEntries = await store.entries();
      const sObject = Object.fromEntries(settingEntries);

      console.log(sObject);

      const cleanSO = parseSettings(sObject);

      if (cleanSO.error) {
        console.log(cleanSO.error);
        return;
      }
      const settings = cleanSO.data;
      setSettings(settings);
      console.log(settings);

      if (!settings.lastNotesOpend || settings.lastNotesOpend.length < 1) {
        return;
      }

      readFile(settings.lastNotesOpend[0]);
    };
    loadAppConfig();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }
    // console.log('debounce effect triggerd');

    if (!note) {
      // console.log('no notes open');
    } else if (note.title !== '') {
      // console.log('debounce note found');
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
      // console.log('new note:', newNote);
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
    <SettingsContext.Provider value={{ settings, setSettings }}>
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
                        // console.log('trying to update the debounce');
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
    </SettingsContext.Provider>
  );
}

export default App;
