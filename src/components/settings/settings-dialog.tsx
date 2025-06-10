import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '../ui/dialog';
import { ModeToggle } from '../mode-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useState } from 'react';
import { useSettingsContext } from '@/context/settingsContext';
import { LazyStore } from '@tauri-apps/plugin-store';
import { FontFaces, useFontContext } from '@/context/fontContext';

export default function SettingsDialog() {
  const [storeInstance] = useState(() => new LazyStore('settings.json'));
  const { settings, setSettings } = useSettingsContext();
  const [fontState, setFontState] = useState(settings.fontFace || '');
  const { setFont } = useFontContext();

  function handleFontChange(newFont: string) {
    if (newFont === fontState) {
      return;
    }

    const fontFacesSet = new Set<FontFaces>(['nunito', 'quicksand']);
    if (fontFacesSet.has(newFont as FontFaces)) {
      setFontState(newFont);
      setSettings((prevSettings) => ({
        ...prevSettings,
        fontFace: newFont,
      }));
      storeInstance.set('fontFace', newFont);
      storeInstance.save();
      setFont(newFont as FontFaces);
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Settings />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Settings</DialogHeader>
        <div className="flex justify-between">
          <p className="w-full">Vault location:</p>
          <span className="text-nowrap">[location goes here]</span>
        </div>
        <div className="flex justify-between">
          <p>Font</p>
          <Select onValueChange={handleFontChange} value={fontState}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quicksand">Quicksand</SelectItem>
              <SelectItem value="nunito">Nunito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between">
          <p>zoom / font size</p>
          <span>[number?]</span>
        </div>
        <div className="flex justify-between">
          <p>Dark mode</p>
          <ModeToggle />
        </div>
      </DialogContent>
    </Dialog>
  );
}
