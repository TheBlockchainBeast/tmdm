'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = 'markets' | 'watchlist' | 'portfolio' | 'profile';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavItem>('markets');

  // Update active tab based on current route
  useEffect(() => {
    if (pathname === '/watchlist') {
      setActiveTab('watchlist');
    } else if (pathname === '/portfolio') {
      setActiveTab('portfolio');
    } else if (pathname === '/profile') {
      setActiveTab('profile');
    } else if (pathname === '/') {
      setActiveTab('markets');
    }
  }, [pathname]);

  const navItems = [
    { id: 'markets' as NavItem, icon: 'dashboard', label: 'Markets', path: '/' },
    { id: 'watchlist' as NavItem, icon: 'star', label: 'Watchlist', path: '/watchlist' },
    { id: 'portfolio' as NavItem, icon: 'account_balance_wallet', label: 'Portfolio', path: '/portfolio' },
    { id: 'profile' as NavItem, icon: 'person', label: 'Profile', path: '/profile' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`material-symbols-outlined ${
                isActive ? 'text-primary' : 'text-[#4c6c9a] dark:text-slate-400'
              }`}
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : undefined,
              }}
            >
              {item.icon}
            </span>
            <span
              className={`text-[10px] font-bold uppercase ${
                isActive ? 'text-primary' : 'text-[#4c6c9a] dark:text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
