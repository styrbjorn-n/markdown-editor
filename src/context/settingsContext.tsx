import { createContext, Dispatch, SetStateAction, useContext } from 'react';
import { z } from 'zod';

export const settingsSchema = z.object({
  notesVault: z.string(),
  lastNotesOpend: z.array(z.string()),
});
export type SettingsType = z.infer<typeof settingsSchema>;

export type SettingsContextType = {
  settings: SettingsType;
  setSettings: Dispatch<SetStateAction<SettingsType>>;
};

export const parseSettings = (data: unknown) => {
  return settingsSchema.safeParse(data);
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: { lastNotesOpend: [], notesVault: '' },
  setSettings: () => {},
});

export const useSettingsContext = () => useContext(SettingsContext);
