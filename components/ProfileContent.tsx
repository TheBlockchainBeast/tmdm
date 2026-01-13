'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import ErrorState from './ErrorState';
import { getUserId, getUserWatchlist, getUserAlerts } from '@/lib/firebase-watchlist';
import { getTelegramUser } from '@/lib/telegram';

interface UserStats {
  watchlistCount: number;
  activeAlerts: number;
  priceAlerts: number;
  sentimentAlerts: number;
}

export default function ProfileContent() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [stats, setStats] = useState<UserStats>({
    watchlistCount: 0,
    activeAlerts: 0,
    priceAlerts: 0,
    sentimentAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name?: string;
    username?: string;
    photoUrl?: string;
  } | null>(null);

  const walletAddress = wallet?.account?.address || null;

  useEffect(() => {
    // Get Telegram WebApp user info if available
    const loadUserInfo = () => {
      if (typeof window === 'undefined') return;

      // Try to get Telegram user
      const telegramUser = getTelegramUser();
      
      if (telegramUser) {
        const fullName = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim();
        
        setUserInfo({
          id: `tg_${telegramUser.id}`,
          name: fullName || telegramUser.username || undefined,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
        });
      } else {
        // Fallback to user ID
        const userId = getUserId();
        setUserInfo({
          id: userId,
        });
      }
    };

    // Try immediately
    loadUserInfo();

    // Also try after a short delay in case Telegram WebApp script hasn't loaded yet
    const timeout = setTimeout(loadUserInfo, 500);

    // Listen for Telegram WebApp ready event
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }
    }

    return () => clearTimeout(timeout);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getUserId();

      const [watchlist, alerts] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
      ]);

      let priceAlerts = 0;
      let sentimentAlerts = 0;

      alerts.forEach((alertStatus) => {
        if (alertStatus.price) priceAlerts++;
        if (alertStatus.sentiment) sentimentAlerts++;
      });

      setStats({
        watchlistCount: watchlist.length,
        activeAlerts: priceAlerts + sentimentAlerts,
        priceAlerts,
        sentimentAlerts,
      });
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = () => {
    tonConnectUI.disconnect();
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-20 max-w-[480px] mx-auto bg-background-light dark:bg-background-dark">
      <TopAppBar />
      {/* Spacer for fixed header */}
      <div className="h-[60px]"></div>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Profile Header */}
        <section className="flex flex-col items-center pt-8 pb-6 px-4">
          <div className="relative mb-4">
            {userInfo?.photoUrl ? (
              <img
                src={userInfo.photoUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <span className="material-symbols-outlined text-primary text-5xl">person</span>
              </div>
            )}
          </div>
          <h1 className="text-[#0d131b] dark:text-white text-2xl font-bold mb-1">
            {userInfo?.name || userInfo?.username || 'User'}
          </h1>
          {userInfo?.username && (
            <p className="text-[#4c6c9a] dark:text-slate-400 text-sm">@{userInfo.username}</p>
          )}
          <p className="text-[#4c6c9a] dark:text-slate-400 text-xs mt-2 font-mono">
            {userInfo?.id}
          </p>
        </section>

        {/* Wallet Section */}
        <section className="px-4 mb-6">
          <div className="bg-slate-100 dark:bg-[#1c2633] rounded-2xl p-4 border border-slate-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#0d131b] dark:text-white text-sm font-bold">Wallet</h2>
              {walletAddress && (
                <button
                  onClick={handleDisconnectWallet}
                  className="text-xs text-red-500 font-bold"
                >
                  Disconnect
                </button>
              )}
            </div>
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0d131b] dark:text-white text-sm font-bold truncate">
                    {formatAddress(walletAddress)}
                  </p>
                  <p className="text-[#4c6c9a] dark:text-slate-400 text-xs">Connected</p>
                </div>
                <span className="material-symbols-outlined text-green-500">check_circle</span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 transition-colors"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Connect Wallet
              </button>
            )}
          </div>
        </section>

        {/* Statistics */}
        <section className="px-4 mb-6">
          <h2 className="text-[#0d131b] dark:text-white text-sm font-bold mb-3">Statistics</h2>
          {error ? (
            <ErrorState
              error={error}
              onRetry={fetchStats}
              title="Failed to Load Statistics"
              showRetry={true}
            />
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800 animate-pulse">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800">
                <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium mb-1">Watchlist</p>
                <p className="text-[#0d131b] dark:text-white text-2xl font-bold">{stats.watchlistCount}</p>
              </div>
              <div className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800">
                <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium mb-1">Active Alerts</p>
                <p className="text-[#0d131b] dark:text-white text-2xl font-bold">{stats.activeAlerts}</p>
              </div>
              <div className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800">
                <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium mb-1">Price Alerts</p>
                <p className="text-[#0d131b] dark:text-white text-2xl font-bold">{stats.priceAlerts}</p>
              </div>
              <div className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800">
                <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium mb-1">Sentiment Alerts</p>
                <p className="text-[#0d131b] dark:text-white text-2xl font-bold">{stats.sentimentAlerts}</p>
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section className="px-4 mb-6">
          <h2 className="text-[#0d131b] dark:text-white text-sm font-bold mb-3">About</h2>
          <div className="bg-slate-100 dark:bg-[#1c2633] rounded-xl p-4 border border-slate-200 dark:border-gray-800">
            <p className="text-[#4c6c9a] dark:text-slate-400 text-xs leading-relaxed">
              TMD Markets - Your gateway to memes on TON blockchain. Track prices, monitor sentiment, and manage your portfolio all in one place.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
