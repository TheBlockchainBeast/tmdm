'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId } from '@/lib/firebase-watchlist';

interface MarketRowProps {
  rank: number;
  name: string;
  icon: string;
  change: string;
  isPositive: boolean;
  bullishPercent: number;
  bearishPercent: number;
  votes: string;
  address: string;
}

export default function MarketRow({
  rank,
  name,
  icon,
  change,
  isPositive,
  bullishPercent,
  bearishPercent,
  votes,
  address,
}: MarketRowProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const userId = getUserId();
        const response = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const data = await response.json();
          const favoriteList = data.addresses || [];
          setIsFavorite(favoriteList.includes(address.toLowerCase()));
        }
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    };

    checkFavorite();
  }, [address]);

  const handleClick = () => {
    router.push(`/token/${address}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking favorite button
    
    if (loading) return;
    
    setLoading(true);
    try {
      const userId = getUserId();
      const action = isFavorite ? 'remove' : 'add';
      
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: address,
          action,
          userId,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        // Trigger custom event to notify parent components
        window.dispatchEvent(new Event('favorites-changed'));
      } else {
        console.error('Failed to update favorite');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setLoading(false);
    }
  };
  const getGradient = (name: string) => {
    const gradients: Record<string, string> = {
      DOGS: 'from-orange-400 to-yellow-200',
      REDI: 'from-blue-400 to-cyan-200',
      NOT: 'from-purple-400 to-pink-200',
      TONY: 'from-green-400 to-lime-200',
    };
    return gradients[name] || 'from-gray-400 to-gray-200';
  };

  return (
    <div
      onClick={handleClick}
      className="px-4 py-4 flex items-center border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
    >
      <div className="w-8 text-xs font-bold text-[#4c6c9a] dark:text-slate-400">{rank}</div>
      <div className="flex-1 flex items-center gap-3">
        <div
          className={`w-8 h-8 dark:w-9 dark:h-9 rounded-full bg-gradient-to-tr ${getGradient(name)} flex items-center justify-center text-white font-bold text-[10px] shadow-sm dark:shadow-lg overflow-hidden dark:border dark:border-white/10`}
        >
          <img
            alt={`${name} icon`}
            className="w-full h-full object-cover"
            src={icon}
          />
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#0d131b] dark:text-white leading-tight">
            ${name}
          </p>
          <div className="flex items-center gap-1">
            <span
              className={`material-symbols-outlined ${isPositive ? 'text-[#07883b] dark:text-[#3fb950]' : 'text-[#e73908] dark:text-[#f85149]'}`}
              style={{ fontSize: '12px' }}
            >
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
            <p className={`text-[10px] font-bold ${isPositive ? 'text-[#07883b] dark:text-[#3fb950]' : 'text-[#e73908] dark:text-[#f85149]'}`}>
              {change}
            </p>
          </div>
        </div>
      </div>
      <div className="w-24 flex flex-col items-center gap-1">
        <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-[#07883b] dark:bg-[#238636]" style={{ width: `${bullishPercent}%` }}></div>
          <div className="h-full bg-[#e73908] dark:bg-[#da3633]" style={{ width: `${bearishPercent}%` }}></div>
        </div>
        <div className="flex justify-between w-full text-[9px] font-bold px-0.5">
          <span className="text-[#07883b] dark:text-[#3fb950]">{bullishPercent}%</span>
          <span className="text-[#e73908] dark:text-[#f85149]">{bearishPercent}%</span>
        </div>
      </div>
      <div className="w-20 flex flex-col items-end gap-2">
        <p className="text-xs font-extrabold text-[#0d131b] dark:text-white">{votes}</p>
        <button
          onClick={handleFavoriteClick}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
            isFavorite
              ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
          } active:scale-95`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span
            className={`material-symbols-outlined ${
              isFavorite
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-slate-400 dark:text-slate-500'
            }`}
            style={{ fontSize: '20px' }}
          >
            {isFavorite ? 'star' : 'star_border'}
          </span>
        </button>
      </div>
    </div>
  );
}
