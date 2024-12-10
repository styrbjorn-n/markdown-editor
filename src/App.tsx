import './App.css';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SidebarTrigger } from './components/ui/sidebar';
import { Textarea } from './components/ui/textarea';

function App() {
  const filename = 'welcome';
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');
  const [textContent, setTextContent] = useState('');

  async function readFile() {
    setTextContent(await invoke('read_file', { filename }));
  }

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke('greet', { name }));
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
