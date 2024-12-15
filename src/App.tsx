import './App.css';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SidebarTrigger } from './components/ui/sidebar';
import { Textarea } from './components/ui/textarea';
import { LazyStore } from '@tauri-apps/plugin-store';
import useDebounce from './hooks/use-debounce';
import assert from 'assert';
type Note = {
  title: String;
  path: String;
  content: string;
};

function App() {
  const filename = 'welcome';
  const store = new LazyStore('settings.json');
  const [notes, setNotes] = useState<Note[]>();
  const [textContent, setTextContent] = useState<string>('');
  const debouncedContent = useDebounce(textContent);

  async function readFile() {
    const vaultPath = await store.get<{ value: String }>('notesVault');
    const res: Note = await invoke('read_file', { filename, vaultPath });
    console.log(res);
    setNotes([res]);
    if (res) {
      setTextContent(res.content);
    } else {
      setTextContent('womp womp');
    }
    console.log('reading file');
  }

  async function saveFile(note: Note) {
    await invoke('save_file', { note });
  }

  useEffect(() => {
    if (textContent === '') {
      readFile();
    }
  }, []);

  useEffect(() => {
    if (!notes) {
      console.log('no notes open');
    } else {
      const note = { ...notes[0], content: textContent };
      saveFile(note);
    }
  }, [debouncedContent]);

  return (
    <div className=" relative h-full w-full shrink flex flex-col item ">
      <SidebarTrigger />
      <div className="w-full h-full flex justify-center ">
        <div className="w-full h-full max-w-[600px] relative mx-8 border-t ">
          <p className="absolute top-[-1.5rem] text-gray-500 font-thin left-0">
            filename
          </p>
          <Textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
