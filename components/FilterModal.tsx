'use client';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: 'votes' | 'priceChange' | 'bullish';
  onSortChange: (sortBy: 'votes' | 'priceChange' | 'bullish') => void;
  minBullish: number;
  onMinBullishChange: (value: number) => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  minBullish,
  onMinBullishChange,
}: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl z-50 max-w-[480px] mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-[#0d131b] dark:text-white">Filters</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[#0d131b] dark:text-white">close</span>
            </button>
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#0d131b] dark:text-white mb-3">
              Sort By
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onSortChange('votes')}
                className={`px-4 py-3 rounded-xl text-left transition-colors ${
                  sortBy === 'votes'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-[#0d131b] dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Most Votes</span>
                  {sortBy === 'votes' && (
                    <span className="material-symbols-outlined">check</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => onSortChange('priceChange')}
                className={`px-4 py-3 rounded-xl text-left transition-colors ${
                  sortBy === 'priceChange'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-[#0d131b] dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Price Change (24h)</span>
                  {sortBy === 'priceChange' && (
                    <span className="material-symbols-outlined">check</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => onSortChange('bullish')}
                className={`px-4 py-3 rounded-xl text-left transition-colors ${
                  sortBy === 'bullish'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-[#0d131b] dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Most Bullish</span>
                  {sortBy === 'bullish' && (
                    <span className="material-symbols-outlined">check</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Min Bullish % */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#0d131b] dark:text-white mb-3">
              Minimum Bullish %: {minBullish}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minBullish}
              onChange={(e) => onMinBullishChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-[#4c6c9a] dark:text-slate-400 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onSortChange('votes');
                onMinBullishChange(0);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-[#0d131b] dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
