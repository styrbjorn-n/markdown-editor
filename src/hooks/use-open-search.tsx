import { useEffect } from 'react';

interface UseOpenSearchArgs {
  isSearchOpen: boolean;
  toggleSearch: () => void;
}

export function useOpenSearch({
  isSearchOpen,
  toggleSearch,
}: UseOpenSearchArgs) {
  useEffect(() => {
    if (isSearchOpen) {
      return;
    }

    function keyDownHandler(e: globalThis.KeyboardEvent) {
      if (!isSearchOpen && e.ctrlKey && e.altKey && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
      }
    }

    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, [isSearchOpen, toggleSearch]);
}
