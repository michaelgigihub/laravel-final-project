import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeToggle() {
  const { appearance, updateAppearance } = useAppearance();

  const toggleTheme = () => {
    // If currently system, determine what to switch to based on actual theme
    if (appearance === 'system') {
      const isDark = document.documentElement.classList.contains('dark');
      updateAppearance(isDark ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      updateAppearance(appearance === 'light' ? 'dark' : 'light');
    }
  };

  const isDarkMode =
    appearance === 'dark' ||
    (appearance === 'system' &&
      document.documentElement.classList.contains('dark'));

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
        }`}
    >
      <span
        className={`absolute top-1 left-1 flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-200 ${isDarkMode
            ? 'translate-x-5 bg-black'
            : 'translate-x-0 bg-white'
          }`}
      >
        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}
