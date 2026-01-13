'use client';

import { useRouter } from 'next/navigation';

interface WatchlistRowProps {
  address: string;
  name: string;
  symbol: string;
  icon: string;
  price: string;
  priceChange: string;
  isPositive: boolean;
  bullishPercent: number;
  bearishPercent: number;
  hasPriceAlert: boolean;
  hasSentimentAlert: boolean;
  onPriceAlertToggle: () => void;
  onSentimentAlertToggle: () => void;
}

export default function WatchlistRow({
  address,
  name,
  symbol,
  icon,
  price,
  priceChange,
  isPositive,
  bullishPercent,
  bearishPercent,
  hasPriceAlert,
  hasSentimentAlert,
  onPriceAlertToggle,
  onSentimentAlertToggle,
}: WatchlistRowProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/token/${address}`);
  };

  const handleAlertClick = (e: React.MouseEvent, type: 'price' | 'sentiment') => {
    e.stopPropagation();
    if (type === 'price') {
      onPriceAlertToggle();
    } else {
      onSentimentAlertToggle();
    }
  };

  // Determine sentiment label and color
  const getSentimentLabel = () => {
    if (bullishPercent >= 70) return { label: `${bullishPercent}% Bullish`, color: 'text-green-500' };
    if (bearishPercent >= 70) return { label: `${bearishPercent}% Bearish`, color: 'text-red-500' };
    return { label: `${bullishPercent}% Neutral`, color: 'text-amber-500' };
  };

  const sentiment = getSentimentLabel();
  const sentimentBarColor = bullishPercent >= 70 ? 'bg-green-500' : bearishPercent >= 70 ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/30 px-4 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
    >
      <div className="relative">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border border-slate-200 dark:border-slate-700"
          style={{ backgroundImage: `url("${icon}")` }}
        />
      </div>
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[#0d131b] dark:text-white text-base font-bold truncate">{name}</p>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
            {symbol}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${sentimentBarColor}`} style={{ width: `${bullishPercent}%` }}></div>
          </div>
          <p className={`${sentiment.color} text-xs font-bold leading-none`}>{sentiment.label}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-[#0d131b] dark:text-white text-sm font-bold">{price}</p>
        <p className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {priceChange}
        </p>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={(e) => handleAlertClick(e, 'price')}
          className={`flex size-6 items-center justify-center rounded-md transition-colors ${
            hasPriceAlert
              ? 'text-primary bg-primary/10'
              : 'text-slate-300 dark:text-slate-700'
          }`}
        >
          <span className={`material-symbols-outlined !text-[18px] ${hasPriceAlert ? 'fill-icon' : ''}`}>
            {hasPriceAlert ? 'notifications_active' : 'notifications'}
          </span>
        </button>
        <button
          onClick={(e) => handleAlertClick(e, 'sentiment')}
          className={`flex size-6 items-center justify-center rounded-md transition-colors ${
            hasSentimentAlert
              ? 'text-primary bg-primary/10'
              : 'text-slate-300 dark:text-slate-700'
          }`}
        >
          <span className={`material-symbols-outlined !text-[18px] ${hasSentimentAlert ? 'fill-icon' : ''}`}>
            psychology
          </span>
        </button>
      </div>
    </div>
  );
}
