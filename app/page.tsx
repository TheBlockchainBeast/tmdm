'use client';

import { useEffect, useState } from 'react';
import TopAppBar from '@/components/TopAppBar';
import StatsStrip from '@/components/StatsStrip';
import SearchBar from '@/components/SearchBar';
import MarketList from '@/components/MarketList';
import BottomNav from '@/components/BottomNav';
import FilterModal from '@/components/FilterModal';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'votes' | 'priceChange' | 'bullish'>('votes');
  const [minBullish, setMinBullish] = useState(0);
  useEffect(() => {
    // Suppress hydration warnings from browser extensions
    const suppressHydrationWarning = () => {
      if (typeof window !== 'undefined') {
        // Remove extension-added attributes that cause hydration warnings
        const body = document.body;
        if (body) {
          const attrsToRemove = ['cz-shortcut-listen', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
          attrsToRemove.forEach(attr => {
            if (body.hasAttribute(attr)) {
              body.removeAttribute(attr);
            }
          });
        }
      }
    };

    suppressHydrationWarning();

    // Initialize Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Set theme colors if available
      if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
      }

      // Sync with Telegram theme (optional - user can override with toggle)
      const updateTheme = () => {
        // Only set initial theme if user hasn't manually toggled
        if (!localStorage.getItem('theme-preference')) {
          if (tg.colorScheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };

      updateTheme();
      tg.onEvent('themeChanged', updateTheme);
    }
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root max-w-[480px] mx-auto bg-white dark:bg-background-dark shadow-xl">
      <TopAppBar />
      {/* Spacer for fixed header */}
      <div className="h-[60px]"></div>
      <StatsStrip />
      
      {/* Sticky Search Bar and Table Header - sticks below TopAppBar when scrolling */}
      <div 
        className="sticky top-[60px] z-40 bg-white dark:bg-background-dark shadow-sm"
      >
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setShowFilterModal(true)}
          showFavorites={showFavorites}
          onFavoritesToggle={() => setShowFavorites(!showFavorites)}
        />
        
        {/* Table Header */}
        <div className="px-4 py-2 flex items-center text-[10px] font-bold text-[#4c6c9a] dark:text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-background-dark">
          <div className="w-8">#</div>
          <div className="flex-1">Name</div>
          <div className="w-24 text-center">Sentiment 24h</div>
          <div className="w-16 text-right">Votes</div>
        </div>
      </div>

      <MarketList
        searchQuery={searchQuery}
        sortBy={sortBy}
        minBullish={minBullish}
        showFavorites={showFavorites}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        minBullish={minBullish}
        onMinBullishChange={setMinBullish}
      />

      {/* Footer Padding */}
      <div className="h-20 bg-transparent"></div>

      <BottomNav />
    </div>
  );
}
