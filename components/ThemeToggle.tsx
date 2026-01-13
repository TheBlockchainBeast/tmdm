'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme-preference');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let initialDark = false;
    if (savedTheme) {
      initialDark = savedTheme === 'dark';
    } else {
      initialDark = systemPrefersDark;
    }
    
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Save preference
    localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-50 dark:bg-slate-800">
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
          dark_mode
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-50 dark:bg-slate-800 text-[#0d131b] dark:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
