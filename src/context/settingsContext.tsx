import { LazyStore } from '@tauri-apps/plugin-store';
import { createContext, useContext, useEffect, useState } from 'react';

const store = new LazyStore('settings.json');

const settingsConetext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    async function loadSettings() {
      const entries = await store.entries();
      setSettings(Object.fromEntries(entries));
    }
    loadSettings();
  }, []);

  const updateSettings = async (key, value) => {
    await store.set(key, value);
    await store.save();
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <settingsConetext.Provider value={{ settings, updateSettings }}>
      {children}
    </settingsConetext.Provider>
  );
}

export function useSettings() {
  return useContext(settingsConetext);
}
