'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import WatchlistRow from './WatchlistRow';
import WatchlistRowSkeleton from './WatchlistRowSkeleton';
import AlertHistoryRow from './AlertHistoryRow';
import ManageAlertsModal from './ManageAlertsModal';
import ErrorState from './ErrorState';
import { formatPriceChange } from '@/lib/dexscreener';
import type { DexScreenerPair } from '@/lib/dexscreener';
import { getUserId } from '@/lib/firebase-watchlist';

interface TokenData {
  address: string;
  pair: DexScreenerPair | null;
  pairs: DexScreenerPair[];
  metadata?: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image?: string;
    description?: string;
  } | null;
}

interface WatchlistToken {
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
}

interface AlertHistoryItem {
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
  type: 'price' | 'sentiment';
  action: 'enabled' | 'disabled';
  timestamp: string;
}

export default function WatchlistContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'alerts'>('list');
  const [tokens, setTokens] = useState<WatchlistToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const fetchWatchlistData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getUserId();

      // Fetch watchlist, token data, sentiment data, and alerts in parallel
      const [watchlistResponse, tokensResponse, sentimentResponse, alertsResponse] = await Promise.all([
        fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/tokens?limit=1000&offset=0`),
        fetch('/api/sentiment/all'),
        fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`),
      ]);

      if (!watchlistResponse.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const watchlistData = await watchlistResponse.json();
      const favorites = watchlistData.addresses || [];

      if (favorites.length === 0) {
        setTokens([]);
        setLoading(false);
        return;
      }

      if (!tokensResponse.ok) {
        throw new Error('Failed to fetch token data');
      }

      const tokensData: { tokens: TokenData[] } = await tokensResponse.json();

      // Get sentiment data
      let sentimentMap = new Map<string, { bullishPercent: number; bearishPercent: number }>();
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        sentimentData.tokens?.forEach((sentiment: any) => {
          sentimentMap.set(sentiment.address.toLowerCase(), {
            bullishPercent: sentiment.bullishPercent,
            bearishPercent: sentiment.bearishPercent,
          });
        });
      }

      // Get alerts data
      let alertsMap = new Map<string, { price: boolean; sentiment: boolean }>();
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.alerts) {
          Object.entries(alertsData.alerts).forEach(([address, alerts]: [string, any]) => {
            alertsMap.set(address.toLowerCase(), alerts);
          });
        }
      }

      // Filter to only favorite tokens and transform
      const watchlistTokens: WatchlistToken[] = tokensData.tokens
        .filter((tokenData) => favorites.includes(tokenData.address.toLowerCase()))
        .map((tokenData) => {
          const pair = tokenData.pair;
          const metadata = tokenData.metadata;
          const sentiment = sentimentMap.get(tokenData.address.toLowerCase());
          const alerts = alertsMap.get(tokenData.address.toLowerCase()) || { price: false, sentiment: false };

          const symbol = metadata?.symbol || pair?.baseToken?.symbol || 'TOKEN';
          const icon = pair?.info?.imageUrl || metadata?.image || '/logo.jpg';
          const priceUsd = pair?.priceUsd ? parseFloat(pair.priceUsd) : 0;
          const priceChange24h = pair?.priceChange?.h24 || 0;
          const isPositive = priceChange24h >= 0;

          // Format price
          const price = priceUsd > 0.01 
            ? `$${priceUsd.toFixed(2)}`
            : priceUsd > 0
            ? `$${priceUsd.toFixed(6)}`
            : '-';

          return {
            address: tokenData.address,
            name: symbol,
            symbol: symbol.toUpperCase(),
            icon,
            price,
            priceChange: formatPriceChange(priceChange24h),
            isPositive,
            bullishPercent: sentiment?.bullishPercent || 50,
            bearishPercent: sentiment?.bearishPercent || 50,
            hasPriceAlert: alerts.price,
            hasSentimentAlert: alerts.sentiment,
          };
        });

      setTokens(watchlistTokens);
      setError(null);
    } catch (error: any) {
      setTokens([]);
      setError(error?.message || 'Failed to load watchlist data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlistData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchWatchlistData, 30000);
    return () => clearInterval(interval);
  }, [fetchWatchlistData]);

  // Listen for favorites changes
  useEffect(() => {
    const handleFavoritesChange = () => {
      fetchWatchlistData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('favorites-changed', handleFavoritesChange);
      return () => {
        window.removeEventListener('favorites-changed', handleFavoritesChange);
      };
    }
  }, [fetchWatchlistData]);


  const fetchAlertHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const userId = getUserId();
      const response = await fetch(`/api/alerts/history?userId=${encodeURIComponent(userId)}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setAlertHistory(data.history || []);
      }
    } catch (error) {
      // Error fetching alert history
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'alerts') {
      fetchAlertHistory();
    }
  }, [viewMode, fetchAlertHistory]);

  const handleAlertToggle = async (address: string, type: 'price' | 'sentiment') => {
    try {
      const userId = getUserId();
      const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
      const current = type === 'price' ? token?.hasPriceAlert : token?.hasSentimentAlert;
      const newValue = !current;

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: address,
          type,
          enabled: newValue,
          userId,
          tokenSymbol: token?.symbol,
          tokenName: token?.name,
        }),
      });

      if (response.ok) {
        // Update local state
        setTokens(prev => prev.map(token => 
          token.address.toLowerCase() === address.toLowerCase()
            ? { 
                ...token, 
                [type === 'price' ? 'hasPriceAlert' : 'hasSentimentAlert']: newValue 
              }
            : token
        ));
        
        // Refresh history if in alerts view
        if (viewMode === 'alerts') {
          fetchAlertHistory();
        }
      }
    } catch (error) {
      // Error updating alert
    }
  };

  const handleManageAlertsUpdate = () => {
    fetchWatchlistData();
    if (viewMode === 'alerts') {
      fetchAlertHistory();
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-20 max-w-[480px] mx-auto bg-white dark:bg-background-dark">
      <TopAppBar />
      {/* Spacer for fixed header */}
      <div className="h-[60px]"></div>

      {/* Segmented Control */}
      <div className="flex px-4 py-3 bg-background-light dark:bg-background-dark">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-200 dark:bg-[#233348] p-1">
          <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${
            viewMode === 'list'
              ? 'bg-white dark:bg-background-dark shadow-sm text-primary'
              : 'text-slate-500 dark:text-[#92a9c9]'
          } text-sm font-semibold leading-normal`}>
            <span className="truncate">List View</span>
            <input
              checked={viewMode === 'list'}
              onChange={() => setViewMode('list')}
              className="invisible w-0"
              name="view-toggle"
              type="radio"
              value="List View"
            />
          </label>
          <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${
            viewMode === 'alerts'
              ? 'bg-white dark:bg-background-dark shadow-sm text-primary'
              : 'text-slate-500 dark:text-[#92a9c9]'
          } text-sm font-semibold leading-normal`}>
            <span className="truncate">Alert History</span>
            <input
              checked={viewMode === 'alerts'}
              onChange={() => setViewMode('alerts')}
              className="invisible w-0"
              name="view-toggle"
              type="radio"
              value="Alert History"
            />
          </label>
        </div>
      </div>

      {/* Watchlist Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Table Headers - Only show in list view */}
        {viewMode === 'list' && (
          <div className="flex px-4 py-2 border-b border-slate-200 dark:border-slate-800/50">
            <div className="flex-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Token / Sentiment
            </div>
            <div className="w-24 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Price
            </div>
            <div className="w-16 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Alerts
            </div>
          </div>
        )}

        {/* List Items */}
        {viewMode === 'list' ? (
          loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 4 }).map((_, index) => (
                <WatchlistRowSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={fetchWatchlistData}
            />
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">bookmark_border</span>
              <p className="text-[#4c6c9a] dark:text-slate-400 text-sm font-bold mb-2">No tokens in watchlist</p>
              <p className="text-[#4c6c9a] dark:text-slate-500 text-xs text-center">
                Add tokens to your watchlist by tapping the star icon on any token
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold"
              >
                Browse Markets
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {tokens.map((token) => (
                <WatchlistRow
                  key={token.address}
                  {...token}
                  onPriceAlertToggle={() => handleAlertToggle(token.address, 'price')}
                  onSentimentAlertToggle={() => handleAlertToggle(token.address, 'sentiment')}
                />
              ))}
            </div>
          )
        ) : (
          historyLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 4 }).map((_, index) => (
                <WatchlistRowSkeleton key={index} />
              ))}
            </div>
          ) : alertHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">notifications</span>
              <p className="text-[#4c6c9a] dark:text-slate-400 text-sm font-bold mb-2">No alert history</p>
              <p className="text-[#4c6c9a] dark:text-slate-500 text-xs text-center">
                Alert activity will appear here when you enable or disable alerts
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {alertHistory.map((item, index) => (
                <AlertHistoryRow
                  key={`${item.tokenAddress}_${item.type}_${item.timestamp}_${index}`}
                  tokenSymbol={item.tokenSymbol || 'TOKEN'}
                  tokenName={item.tokenName}
                  type={item.type}
                  action={item.action}
                  timestamp={new Date(item.timestamp)}
                />
              ))}
            </div>
          )
        )}

        {/* Manage Global Alerts Button */}
        {tokens.length > 0 && (
          <div className="px-4 py-6 mt-2">
            <button
              onClick={() => setShowManageModal(true)}
              className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-slate-200 dark:bg-[#233348] text-[#0d131b] dark:text-white text-sm font-bold leading-normal tracking-wide active:scale-95 transition-transform"
            >
              <span className="truncate">Manage Global Alerts</span>
              <span className="material-symbols-outlined ml-2 text-[18px]">settings</span>
            </button>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Manage Alerts Modal */}
      <ManageAlertsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        alerts={tokens.map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          priceAlert: token.hasPriceAlert,
          sentimentAlert: token.hasSentimentAlert,
        }))}
        onUpdate={handleManageAlertsUpdate}
      />
    </div>
  );
}
