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
import { fontClassMap, FontContext, FontFaces } from './context/fontContext';

export const NoteSchema = z.object({
  title: z.string(),
  path: z.string(),
  content: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

const defaultSettings: SettingsType = {
  notesVault: '',
  lastNotesOpend: [],
  isFolderOpen: [],
  fontFace: 'quicksand',
};

function App() {
  const [storeInstance] = useState(() => new LazyStore('settings.json'));
  const [note, setNote] = useState<Note>();
  const [newNote, setNewNote] = useState<Note>();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [failedToRead, setFailedToRead] = useState(false);
  const isFirstRender = useRef(true);
  const [content, setContent] = useState('');
  const [font, setFont] = useState<FontFaces>('quicksand');
  let debouncedContent = useDebounce(content);

  async function updateLastOpenedNotes(notePath: string) {
    // Get the current settings to ensure we have the latest data
    const settingEntries = await storeInstance.entries();
    const currentSettings = Object.fromEntries(settingEntries);
    const cleanSettings = parseSettings(currentSettings);

    if (cleanSettings.error) {
      console.error('Error parsing settings:', cleanSettings.error);
      return;
    }

    const currentLastNotesOpend = cleanSettings.data.lastNotesOpend || [];
    const newHistory = Array.from(
      new Set([notePath, ...currentLastNotesOpend])
    ).slice(0, 50);

    await storeInstance.set('lastNotesOpend', newHistory);
    await storeInstance.save();

    setSettings((prevSettings) => ({
      ...prevSettings,
      lastNotesOpend: newHistory,
    }));

    console.log('Updated history:', newHistory);
  }

  async function readFile(filePath: string) {
    if (!filePath) {
      console.error('No file path provided to readFile');
      return;
    }

    const { data: readRes, error: readError } = await tryCatch(
      invoke('read_file', { filePath, withContentReturn: true })
    );

    if (readError) {
      console.error('Error reading file:', readError);
      setFailedToRead(true);
      return;
    }

    try {
      const parsedReadRes = NoteSchema.parse(readRes);

      if (textAreaRef.current) {
        textAreaRef.current.value = parsedReadRes.content;
        setContent(parsedReadRes.content);
        setFailedToRead(false);
        setNote({ ...parsedReadRes });

        // Update the history with the current file path
        await updateLastOpenedNotes(parsedReadRes.path);
      }
    } catch (error) {
      console.error('Error parsing file content:', error);
      setFailedToRead(true);
    }
  }

  // TODO: Add error handling if file fails to save
  async function saveFile(note: Note) {
    if (!note) {
      console.error('No note provided to saveFile');
      return;
    }

    try {
      await invoke('save_file', { note });
      console.log(note.title + ' saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  useEffect(() => {
    const loadAppConfig = async () => {
      try {
        const settingEntries = await storeInstance.entries();
        const sObject = Object.fromEntries(settingEntries);

        console.log('Loaded settings:', sObject);

        const cleanSO = parseSettings(sObject);

        if (cleanSO.error) {
          console.error('Error parsing settings:', cleanSO.error);
          return;
        }

        const loadedSettings = cleanSO.data;
        setSettings(loadedSettings);

        console.log('Parsed settings:', loadedSettings);

        if (
          loadedSettings.lastNotesOpend &&
          loadedSettings.lastNotesOpend.length > 0
        ) {
          console.log(
            'Loading most recent note:',
            loadedSettings.lastNotesOpend[0]
          );
          // Use setTimeout to ensure settings state has updated before reading a file
          setTimeout(() => {
            readFile(loadedSettings.lastNotesOpend[0]);
          }, 0);
        }
      } catch (error) {
        console.error('Error loading app configuration:', error);
      }
    };

    loadAppConfig();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!note) {
      console.log('No notes open, skipping save');
    } else if (note.title !== '') {
      console.log('Saving note with debounced content');
      const updatedNote = { ...note, content: debouncedContent };
      saveFile(updatedNote);
    }
  }, [debouncedContent]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (newNote) {
      console.log('New note selected:', newNote.path);

      if (note && !failedToRead) {
        // Save the current note before loading the new one
        const updatedNote = {
          ...note,
          content: textAreaRef.current?.value || '',
        };
        saveFile(updatedNote);
      }

      readFile(newNote.path);
    }
  }, [newNote]);

  // this is one way of doing it i guess, going to have seperate objects for each ui element
  const zoomLevel = '1.5';

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <FontContext.Provider value={{ font, setFont }}>
        <NoteContext.Provider value={{ note, setNote, newNote, setNewNote }}>
          <main className={`w-full relative ${fontClassMap[font]}`}>
            {/* <div className="absolute bottom-0 z-50 left-1/2 border border-e-red-600 h-screen"></div> */}
            <SidebarProvider>
              <AppSidebar />
              <div className="w-full flex item overflow-y-hidden">
                <SidebarTrigger />
                <SearchDialog />
                {/* this margin prolly need to scale along with the rest of em */}
                <div
                  className="w-full flex justify-center mt-6"
                  style={{ marginTop: `calc(1.5rem * ${zoomLevel})` }}
                >
                  <div
                    className="w-full max-w-[600px] relative mx-8 border-t"
                    // so i guess i need to fuck with the scaling here instead of with tailwind ffs
                    // i also need to deal with the fact it overflows BAD in small windows
                    // the P tag also disapears, guess its to do with the top-[-1.5rem]

                    style={{ zoom: zoomLevel }}
                  >
                    {/* the rem of the p tag needs to scale along with the elements */}
                    <p
                      className="absolute z-50 font-thin left-0 ml-2"
                      style={{ top: `calc(-1.5rem * ${zoomLevel})` }}
                    >
                      {note?.title
                        ? note.title.slice(note.title.lastIndexOf('/') + 1)
                        : 'filename'}
                    </p>
                    <Textarea
                      className="resize-none h-[calc(100vh-50px)] text-base"
                      style={{ lineHeight: `calc(1.5rem * ${zoomLevel})` }}
                      ref={textAreaRef}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </SidebarProvider>
          </main>
        </NoteContext.Provider>
      </FontContext.Provider>
    </SettingsContext.Provider>
  );
}

export default App;
