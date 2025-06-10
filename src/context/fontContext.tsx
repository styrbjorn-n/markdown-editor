import { createContext, Dispatch, SetStateAction, useContext } from 'react';

export type FontFaces = 'quicksand' | 'nunito';

export const fontClassMap: Record<'quicksand' | 'nunito', string> = {
  nunito: 'font-nunito',
  quicksand: 'font-quicksand',
};

export type FontContextType = {
  font: FontFaces;
  setFont: Dispatch<SetStateAction<FontFaces>>;
};

export const FontContext = createContext<FontContextType>({
  font: 'quicksand',
  setFont: () => {},
});

export const useFontContext = () => useContext(FontContext);
