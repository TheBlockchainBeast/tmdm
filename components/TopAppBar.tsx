'use client';

import ThemeToggle from './ThemeToggle';

export default function TopAppBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 max-w-[480px] mx-auto">
      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="flex size-10 shrink-0 items-center justify-center">
          <img
            src="/logo.jpg"
            alt="TMD Markets Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-[#0d131b] dark:text-white text-lg font-extrabold leading-tight tracking-[-0.015em]">
            TMD Markets
          </h2>
          <p className="text-[#4c6c9a] dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            Memes on TON
          </p>
        </div>
        <div className="flex w-10 items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
