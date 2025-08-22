import React, { useEffect, useState } from 'react';

declare const chrome: any;

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['theme'], (res: any) => {
      const isDark = res.theme === 'dark';
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    });
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    chrome.storage.local.set({ theme: next ? 'dark' : 'light' });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="toggle dark mode"
      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
