import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { invoke } from '@tauri-apps/api/core';
import './App.css';
import { ModeToggle } from './components/mode-toggle';
import { SidebarTrigger } from './components/ui/sidebar';
import { Textarea } from './components/ui/textarea';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke('greet', { name }));
  }

  return (
    <div className="h-full w-full shrink flex flex-col item ">
      <SidebarTrigger />
      <div className="w-full h-full flex justify-center ">
        <div className="w-full h-full max-w-[600px] relative mx-8 border-t ">
          <p className="absolute top-[-1.5rem] text-gray-500 font-thin left-0">
            filename
          </p>
          <Textarea />
        </div>
      </div>
    </div>
  );
}

export default App;
