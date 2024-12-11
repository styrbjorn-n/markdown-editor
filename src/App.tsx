import './App.css';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SidebarTrigger } from './components/ui/sidebar';
import { Textarea } from './components/ui/textarea';

type Note = {
  title: String;
  path: String;
  content: string;
};

function App() {
  const filename = 'welcome';
  const [notes, setNotes] = useState<Note[]>();
  const [textContent, setTextContent] = useState<string>('');

  async function readFile() {
    const res: Note = await invoke('read_file', { filename });
    console.log(res);

    setNotes([res]);
    if (res) {
      setTextContent(res.content);
    } else {
      setTextContent('womp womp');
    }
  }

  useEffect(() => {
    if (textContent === '') {
      readFile();
    }
  }, []);

  return (
    <div className="h-full w-full shrink flex flex-col item ">
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
