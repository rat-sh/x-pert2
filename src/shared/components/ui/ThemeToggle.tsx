'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggle
 *
 * Reads/writes the `data-theme` attribute on <html> and persists to localStorage.
 * Falls back to OS preference on first load.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;

    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {dark
        ? <Sun className="w-4 h-4 text-yellow-500 shrink-0" />
        : <Moon className="w-4 h-4 text-indigo-400 shrink-0" />}
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
