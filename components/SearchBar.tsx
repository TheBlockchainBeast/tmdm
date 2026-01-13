'use client';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  showFavorites: boolean;
  onFavoritesToggle: () => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  showFavorites,
  onFavoritesToggle,
}: SearchBarProps) {
  return (
    <div className="px-4 py-3 flex gap-2 items-center bg-white dark:bg-background-dark">
      <label className="flex flex-col flex-1 h-11">
        <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
          <div className="text-[#4c6c9a] flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-3 rounded-l-lg">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              search
            </span>
          </div>
          <input
            className="form-input flex w-full min-w-0 flex-1 border-none bg-slate-100 dark:bg-slate-800 focus:ring-0 text-[#0d131b] dark:text-white placeholder:text-[#4c6c9a] px-3 rounded-r-lg text-sm font-medium"
            placeholder="Search memes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </label>
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0d131b] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          tune
        </span>
      </button>
      <button
        onClick={onFavoritesToggle}
        className={`flex items-center justify-center h-11 w-11 rounded-lg transition-colors active:scale-95 ${
          showFavorites
            ? 'bg-primary text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-[#0d131b] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          {showFavorites ? 'star' : 'star_border'}
        </span>
      </button>
    </div>
  );
}
