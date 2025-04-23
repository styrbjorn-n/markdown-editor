import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '../ui/dialog';

export default function SettingsDialog() {
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
          <p>font</p>
          <span>[font multiselect]</span>
        </div>
        <div className="flex justify-between">
          <p>zoom / font size</p>
          <span>[number?]</span>
        </div>
        <div className="flex justify-between">
          <p>Dark mode</p>
          <span>[toggle switch]</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
