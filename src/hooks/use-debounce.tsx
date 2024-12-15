import { useState, useEffect } from 'react';

const useDebounce = (text: string, milliSeconds = 350) => {
  const [debouncedText, setDebouncedText] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), milliSeconds);

    return () => {
      clearTimeout(timer);
    };
  }, [text, milliSeconds]);

  return debouncedText;
};

export default useDebounce;
