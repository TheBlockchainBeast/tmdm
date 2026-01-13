'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import PortfolioSkeleton from './PortfolioSkeleton';
import ErrorState from './ErrorState';

interface Holding {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  balanceInTon: number;
  price: number;
  priceChange24h: number;
  icon: string;
  color?: string;
}

interface PortfolioData {
  walletAddress: string;
  holdings: Holding[];
  tonPrice: number;
  totalBalanceTon: number;
  totalBalanceUsd: number;
}

const distributionColors = [
  'bg-primary',
  'bg-orange-500',
  'bg-purple-500',
  'bg-emerald-400',
  'bg-cyan-400',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-gray-500',
];

export default function PortfolioContent() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet address from TON Connect
  // TON Connect returns address in format: raw hex (64 chars) or "0:hex" or "EQ..." or "UQ..."
  const walletAddress = wallet?.account?.address || null;
  
  // Format address for API - pass through as-is, let the API route handle normalization
  // The API route will normalize it to the correct format for TON API
  const formatAddress = useCallback((addr: string | null): string | null => {
    if (!addr) return null;
    // Pass through the address as-is - the API route will handle normalization
    // TON API accepts: raw hex, 0:hex, EQ..., UQ...
    return addr;
  }, []);

  const fetchPortfolio = useCallback(async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/portfolio?walletAddress=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch portfolio';
        // Check if it's a network error
        const isNetworkError = !navigator.onLine || errorMessage.includes('Failed to fetch');
        throw new Error(isNetworkError ? 'Network error. Please check your internet connection.' : errorMessage);
      }

      const data: PortfolioData = await response.json();
      
      // Add colors to holdings
      const holdingsWithColors = data.holdings.map((holding, index) => ({
        ...holding,
        color: distributionColors[index % distributionColors.length],
      }));

      setPortfolioData({
        ...data,
        holdings: holdingsWithColors,
      });
      setError(null);
    } catch (err: any) {
      // Better error message handling
      const errorMessage = err.message || 'Failed to load portfolio';
      setError(errorMessage);
      setPortfolioData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const formattedAddress = formatAddress(walletAddress);
    if (formattedAddress) {
      fetchPortfolio(formattedAddress);
      // Refresh every 30 seconds
      const interval = setInterval(() => fetchPortfolio(formattedAddress), 30000);
      return () => clearInterval(interval);
    } else {
      // Clear portfolio data when wallet disconnects
      setPortfolioData(null);
    }
  }, [walletAddress, fetchPortfolio, formatAddress]);

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
    setPortfolioData(null);
  };

  // Calculate real PNL based on 24h price changes
  const calculatePNL = useCallback((data: PortfolioData | null) => {
    if (!data || data.holdings.length === 0) {
      return {
        totalPnl: 0,
        totalPnlPercent: 0,
        pnl24h: 0,
        pnl24hPercent: 0,
      };
    }

    // Calculate 24h PNL: sum of (balance * price * priceChange24h / 100) for each holding
    const pnl24h = data.holdings.reduce((sum, holding) => {
      const holdingValue = holding.balance * holding.price;
      const changeAmount = (holdingValue * holding.priceChange24h) / 100;
      return sum + changeAmount;
    }, 0);

    // Calculate 24h PNL percentage
    const pnl24hPercent = data.totalBalanceUsd > 0 
      ? (pnl24h / data.totalBalanceUsd) * 100 
      : 0;

    // For total PNL, we'll use 24h PNL as a proxy since we don't track entry prices
    // In a real app, you'd track when tokens were purchased and calculate from entry price
    const totalPnl = pnl24h;
    const totalPnlPercent = pnl24hPercent;

    return {
      totalPnl,
      totalPnlPercent,
      pnl24h,
      pnl24hPercent,
    };
  }, []);

  const pnl = portfolioData ? calculatePNL(portfolioData) : {
    totalPnl: 0,
    totalPnlPercent: 0,
    pnl24h: 0,
    pnl24hPercent: 0,
  };

  const buyingPower = portfolioData?.holdings.find(h => h.symbol === 'TON')?.balance || 0;

  // Calculate asset distribution
  const distribution = portfolioData?.holdings.map((holding) => ({
    ...holding,
    percentage: portfolioData.totalBalanceTon > 0
      ? (holding.balanceInTon / portfolioData.totalBalanceTon) * 100
      : 0,
  })) || [];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-20 max-w-[480px] mx-auto bg-background-light dark:bg-background-dark">
      <TopAppBar />
      {/* Spacer for fixed header */}
      <div className="h-[60px]"></div>

      <main className="flex-1 overflow-y-auto pb-24">
        {!walletAddress ? (
          /* Connect Wallet State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-5xl">account_balance_wallet</span>
            </div>
            <h2 className="text-[#0d131b] dark:text-white text-xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-[#4c6c9a] dark:text-gray-400 text-sm text-center mb-8">
              Connect your TON wallet to view your portfolio holdings and track your assets
            </p>
            <button
              onClick={handleConnectWallet}
              className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
            <p className="text-[#4c6c9a] dark:text-gray-400 text-xs text-center mt-4">
              Supported wallets: Tonkeeper, TON Wallet, and more
            </p>
          </div>
        ) : loading ? (
          <PortfolioSkeleton />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              const formattedAddress = formatAddress(walletAddress);
              if (formattedAddress) {
                fetchPortfolio(formattedAddress);
              }
            }}
          />
        ) : portfolioData && portfolioData.holdings.length === 0 ? (
          /* Empty Portfolio State - but still show if there's an error fetching */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <span className="material-symbols-outlined text-[#4c6c9a] dark:text-gray-400 text-5xl mb-4">wallet</span>
            <h2 className="text-[#0d131b] dark:text-white text-xl font-bold mb-2">No Token Holdings</h2>
            <p className="text-[#4c6c9a] dark:text-gray-400 text-sm text-center mb-4">
              Your wallet doesn&apos;t have any token holdings yet. TON balance will appear here if available.
            </p>
            {error && (
              <p className="text-red-500 text-xs text-center mb-4">
                {error}
              </p>
            )}
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#0d131b] dark:text-white font-bold text-sm"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : portfolioData ? (
          <>
            {/* Balance Section */}
            <section className="flex flex-col items-center pt-6 pb-2 px-4">
              <p className="text-[#4c6c9a] dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">
                Total Balance
              </p>
              <h1 className="text-[#0d131b] dark:text-white tracking-tight text-[36px] font-extrabold leading-tight">
                {portfolioData.totalBalanceTon.toFixed(2)} TON
              </h1>
              <h2 className="text-[#4c6c9a] dark:text-gray-400 text-lg font-semibold leading-tight tracking-tight pb-4">
                ${portfolioData.totalBalanceUsd.toFixed(2)} USD
              </h2>
              {/* PNL Badge */}
              {pnl.totalPnl !== 0 && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  pnl.totalPnl > 0 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <span className={`material-symbols-outlined text-sm ${
                    pnl.totalPnl > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {pnl.totalPnl > 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className={`text-sm font-bold ${
                    pnl.totalPnl > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {pnl.totalPnl > 0 ? '+' : ''}${pnl.totalPnl.toFixed(2)} ({pnl.totalPnl > 0 ? '+' : ''}{pnl.totalPnlPercent.toFixed(2)}%)
                  </span>
                </div>
              )}
            </section>

            {/* Stats (24h metrics) */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-100 dark:bg-[#1c2633] border border-slate-200 dark:border-gray-800">
            <p className="text-[#4c6c9a] dark:text-gray-400 text-xs font-medium">24h PNL</p>
            <p className={`text-[#0d131b] dark:text-white text-base font-bold ${
              pnl.pnl24h > 0 ? 'text-green-500' : pnl.pnl24h < 0 ? 'text-red-500' : ''
            }`}>
              {pnl.pnl24h > 0 ? '+' : ''}${pnl.pnl24h.toFixed(2)}
            </p>
            <p className={`text-xs font-bold leading-none ${
              pnl.pnl24hPercent > 0 ? 'text-green-500' : pnl.pnl24hPercent < 0 ? 'text-red-500' : 'text-[#4c6c9a] dark:text-gray-400'
            }`}>
              {pnl.pnl24hPercent > 0 ? '+' : ''}{pnl.pnl24hPercent.toFixed(2)}%
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-100 dark:bg-[#1c2633] border border-slate-200 dark:border-gray-800">
            <p className="text-[#4c6c9a] dark:text-gray-400 text-xs font-medium">Buying Power</p>
            <p className="text-[#0d131b] dark:text-white text-base font-bold">{buyingPower.toFixed(2)} TON</p>
            <p className="text-primary text-xs font-bold leading-none">Available</p>
          </div>
        </div>

        {/* Asset Distribution Bar Chart */}
        <div className="px-4 py-2">
          <h3 className="text-[#0d131b] dark:text-white text-sm font-bold leading-tight tracking-tight mb-3">
            Asset Distribution
          </h3>
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-200 dark:bg-gray-800">
            {distribution.slice(0, 5).map((item, index) => (
              <div
                key={item.symbol}
                className={`h-full ${distributionColors[index] || 'bg-gray-500'}`}
                style={{ width: `${item.percentage}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            {distribution.slice(0, 4).map((item, index) => (
              <div key={item.symbol} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${distributionColors[index] || 'bg-gray-500'}`}
                />
                <span className="text-[10px] font-bold text-[#4c6c9a] dark:text-gray-500 uppercase">
                  {item.symbol} {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-[#0d131b] dark:text-white text-sm font-bold uppercase tracking-wider">
              Your Holdings
            </h3>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-800/40 text-[10px] font-bold text-[#4c6c9a] dark:text-gray-500 uppercase">
            <div className="col-span-4">Asset</div>
            <div className="col-span-4 text-right">Balance</div>
            <div className="col-span-4 text-right">Price / PNL</div>
          </div>

          {/* Holdings List */}
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {portfolioData.holdings.map((holding) => (
              <div
                key={holding.symbol}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-gray-800/20 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${holding.color || 'bg-primary'} flex items-center justify-center overflow-hidden`}
                  >
                    {holding.icon && holding.icon !== '/logo.jpg' ? (
                      <img src={holding.icon} alt={holding.symbol} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{holding.symbol[0]}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[#0d131b] dark:text-white text-sm font-bold leading-none">
                      ${holding.symbol}
                    </div>
                    <div className="text-[#4c6c9a] dark:text-gray-500 text-[10px] mt-1 font-medium">
                      {holding.name}
                    </div>
                  </div>
                </div>
                <div className="col-span-4 text-right">
                  <div className="text-[#0d131b] dark:text-white text-sm font-bold leading-none">
                    {holding.balance >= 1000000
                      ? `${(holding.balance / 1000000).toFixed(1)}M`
                      : holding.balance >= 1000
                      ? `${(holding.balance / 1000).toFixed(1)}K`
                      : holding.balance.toFixed(2)}
                  </div>
                  <div className="text-[#4c6c9a] dark:text-gray-500 text-[10px] mt-1 font-medium">
                    ≈ {holding.balanceInTon.toFixed(1)} TON
                  </div>
                </div>
                <div className="col-span-4 text-right">
                  <div className="text-[#0d131b] dark:text-white text-sm font-bold leading-none">
                    {holding.price >= 0.01
                      ? holding.price.toFixed(2)
                      : holding.price.toFixed(6)}
                  </div>
                  <div
                    className={`text-[10px] mt-1 font-bold ${
                      holding.priceChange24h > 0
                        ? 'text-green-500'
                        : holding.priceChange24h < 0
                        ? 'text-red-500'
                        : 'text-[#4c6c9a] dark:text-gray-400'
                    }`}
                  >
                    {holding.priceChange24h > 0 ? '+' : ''}
                    {holding.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        ) : null}
      </main>

      {/* Floating Connect Wallet Button */}
      {walletAddress && (
        <div className="fixed bottom-24 right-6 z-50">
          <button
            onClick={handleDisconnect}
            className="bg-primary hover:bg-blue-600 text-white flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            title="Disconnect Wallet"
          >
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </button>
        </div>
      )}


      <BottomNav />
    </div>
  );
}
