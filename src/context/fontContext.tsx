import { createContext, Dispatch, SetStateAction, useContext } from 'react';

export type FontFaces = 'quicksand' | 'nunito';

export type FontContextType = {
  font: FontFaces;
  setFont: Dispatch<SetStateAction<FontFaces>>;
};

export const FontContext = createContext<FontContextType>({
  font: 'quicksand',
  setFont: () => {},
});

export const useFontContext = () => useContext(FontContext);
