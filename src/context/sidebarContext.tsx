import { createContext, Dispatch, SetStateAction, useContext } from 'react';

export type SidebarContextType = {
  event: boolean;
  setEvent: Dispatch<SetStateAction<boolean>>;
};

export const SidebarContext = createContext<SidebarContextType>({
  event: false,
  setEvent: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);
