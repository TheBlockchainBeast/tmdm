'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TokenDetailSkeleton from './TokenDetailSkeleton';
import ErrorState from './ErrorState';
import { formatPriceChange } from '@/lib/dexscreener';
import type { DexScreenerPair } from '@/lib/dexscreener';

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

interface TokenDetailProps {
  address: string;
}

interface SentimentData {
  address: string;
  bullishVotes: number;
  bearishVotes: number;
  totalVotes: number;
  bullishPercent: number;
  bearishPercent: number;
  rank: number;
  history: {
    '1D': Array<{ time: string; bullishPercent: number }>;
    '7D': Array<{ time: string; bullishPercent: number }>;
    '1M': Array<{ time: string; bullishPercent: number }>;
  };
}

export default function TokenDetail({ address }: TokenDetailProps) {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState<'bullish' | 'bearish' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [timeRange, setTimeRange] = useState<'1D' | '7D' | '1M'>('1D');
  const [voteError, setVoteError] = useState<string | null>(null);
  const [userVoteStatus, setUserVoteStatus] = useState<{
    hasVoted: boolean;
    canVote: boolean;
    vote?: 'bullish' | 'bearish';
    timeRemaining?: number;
  } | null>(null);

  const fetchTokenData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tokens/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }

      const data: TokenData = await response.json();
      setTokenData(data);
      setError(null);
    } catch (err: any) {
      // Check if it's a network error
      const isNetworkError = err.message?.includes('Failed to fetch') || 
                            err.message?.includes('NetworkError') ||
                            !navigator.onLine;
      setError(isNetworkError ? 'Network error. Please check your internet connection.' : (err.message || 'Failed to load token data'));
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchSentimentData = useCallback(async () => {
    try {
      setSentimentLoading(true);
      const response = await fetch(`/api/tokens/${address}/sentiment`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }

      const data: SentimentData = await response.json();
      setSentimentData(data);
    } catch (err) {
      console.error('Failed to load sentiment data:', err);
      // Set default values if sentiment fetch fails
      setSentimentData({
        address,
        bullishVotes: 0,
        bearishVotes: 0,
        totalVotes: 0,
        bullishPercent: 50,
        bearishPercent: 50,
        rank: 0,
        history: {
          '1D': [],
          '7D': [],
          '1M': [],
        },
      });
    } finally {
      setSentimentLoading(false);
    }
  }, [address]);

  // Get user ID from Telegram WebApp or use localStorage-based identifier
  const getUserId = useCallback((): string => {
    if (typeof window === 'undefined') return 'anonymous';
    
    // Try to get from Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      return `tg-${tg.initDataUnsafe.user.id}`;
    }
    
    // Fallback: use localStorage to create a persistent identifier
    let userId = localStorage.getItem('user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user-id', userId);
    }
    return userId;
  }, []);

  // Check user's vote status
  const checkVoteStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const userId = getUserId();
    try {
      const response = await fetch(`/api/tokens/${address}/vote-status?userId=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const status = await response.json();
        setUserVoteStatus(status);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  }, [address, getUserId]);

  // Set up real-time snapshot listener for sentiment updates
  useEffect(() => {
    // Only set up snapshot on client side
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    try {
      const { subscribeToTokenSentiment } = require('@/lib/firebase-sentiment');
      unsubscribe = subscribeToTokenSentiment(address, (sentiment: SentimentData | null) => {
        if (sentiment) {
          // Merge with existing history if available
          setSentimentData((prev) => {
            if (prev) {
              return {
                ...sentiment,
                history: prev.history, // Preserve history
              };
            }
            // If no previous data, create default history
            return {
              ...sentiment,
              history: {
                '1D': [],
                '7D': [],
                '1M': [],
              },
            };
          });
        }
      });
    } catch (error) {
      console.error('Could not set up real-time sentiment listener:', error);
    }

    // Check vote status when component mounts and when sentiment updates
    checkVoteStatus();

    // Refresh vote status every minute to update countdown
    const voteStatusInterval = setInterval(() => {
      checkVoteStatus();
    }, 60000); // Check every minute

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(voteStatusInterval);
    };
  }, [address, checkVoteStatus]);

  useEffect(() => {
    fetchTokenData();
    fetchSentimentData(); // Initial fetch
    
    // Refresh token data every 30 seconds (sentiment updates via snapshot)
    const interval = setInterval(() => {
      fetchTokenData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTokenData, fetchSentimentData]);

  const handleCopyAddress = async () => {
    if (tokenData?.address) {
      try {
        await navigator.clipboard.writeText(tokenData.address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tokenData?.metadata?.symbol || 'Token'} - TMD Markets`,
        text: `Check out ${tokenData?.metadata?.symbol || 'this token'} on TMD Markets`,
        url: window.location.href,
      }).catch((err) => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };


  const handleVote = async (vote: 'bullish' | 'bearish') => {
    if (voting) return;

    try {
      setVoting(vote);
      setVoteError(null);
      
      const userId = getUserId();
      
      const response = await fetch(`/api/tokens/${address}/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit vote' }));
        const errorMessage = errorData.error || 'Failed to submit vote';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSentimentData((prev) => prev ? { ...prev, ...data } : null);
      
      // Refresh vote status after successful vote
      await checkVoteStatus();
      
      // Snapshot listener will automatically update the UI
    } catch (err: any) {
      console.error('Error voting:', err);
      const errorMessage = err.message || 'Failed to submit vote. Please try again.';
      setVoteError(errorMessage);
      
      // Show error for 3 seconds
      setTimeout(() => setVoteError(null), 3000);
    } finally {
      setVoting(null);
    }
  };

  // Extract social links from DexScreener pair info
  const getSocialLinks = () => {
    if (!tokenData?.pair?.info) return null;

    const info = tokenData.pair.info;
    const links: {
      website?: string;
      telegram?: string;
      twitter?: string;
    } = {};

    // Get website from websites array
    if (info.websites && info.websites.length > 0) {
      links.website = info.websites[0].url;
    }

    // Get social links from socials array
    if (info.socials && info.socials.length > 0) {
      info.socials.forEach((social) => {
        const platform = social.platform.toLowerCase();
        const handle = social.handle;

        if (platform === 'telegram' || platform === 'tg') {
          links.telegram = handle.startsWith('http') ? handle : `https://t.me/${handle.replace('@', '')}`;
        } else if (platform === 'twitter' || platform === 'x') {
          links.twitter = handle.startsWith('http') ? handle : `https://twitter.com/${handle.replace('@', '')}`;
        }
      });
    }

    // Only return if we have at least one link
    return Object.keys(links).length > 0 ? links : null;
  };

  const socialLinks = getSocialLinks();

  const handleSocialLink = (type: 'website' | 'telegram' | 'twitter') => {
    if (!socialLinks) return;

    const url = socialLinks[type];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading || sentimentLoading) {
    return <TokenDetailSkeleton />;
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen">
        <ErrorState
          error={error || 'Token not found'}
          onRetry={fetchTokenData}
          title={error ? undefined : 'Token Not Found'}
          description={error ? undefined : 'The token you\'re looking for doesn\'t exist or has been removed.'}
        />
        <div className="flex justify-center pb-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#0d131b] dark:text-white text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pair = tokenData.pair;
  const metadata = tokenData.metadata;
  
  // Get token symbol/name from TON API metadata first, then DexScreener, then fallback
  const symbol = metadata?.symbol || pair?.baseToken?.symbol || 'TOKEN';
  const tokenName = metadata?.name || pair?.baseToken?.name || symbol;
  const icon = pair?.info?.imageUrl || metadata?.image || '/logo.jpg';
  const contractAddress = tokenData.address;
  const displayAddress = contractAddress.length > 8 
    ? `${contractAddress.slice(0, 3)}...${contractAddress.slice(-4)}`
    : contractAddress;

  // Calculate price change (24h) from DexScreener if available
  const priceChange24h = pair?.priceChange?.h24 || 0;
  const isPositive = priceChange24h >= 0;


  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-10">
      {/* TopAppBar - Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => router.back()}
          className="flex size-10 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#0d131b] dark:text-white">chevron_left</span>
        </button>
        <h2 className="text-[#0d131b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          TMD Markets
        </h2>
        <div className="flex size-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-transparent text-[#0d131b] dark:text-white">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[60px]"></div>

      {/* ProfileHeader */}
      <div className="flex p-4 mt-2">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm"
              style={{ backgroundImage: `url("${icon}")` }}
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <p className="text-[#0d131b] dark:text-white text-2xl font-extrabold leading-tight tracking-tight">
                  ${symbol}
                </p>
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  TON Native
                </span>
              </div>
              <p className="text-[#4c6c9a] dark:text-slate-400 text-sm font-medium font-mono">
                {displayAddress}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyAddress}
              className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0d131b] dark:text-white text-sm font-bold shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">
                {copySuccess ? 'check' : 'content_copy'}
              </span>
              <span className="truncate">{copySuccess ? 'Copied!' : 'Copy CA'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex cursor-pointer items-center justify-center rounded-xl h-12 w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0d131b] dark:text-white shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ActionsBar - Only show if social links are available */}
      {socialLinks && (
        <div className="px-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-800">
            {socialLinks.website && (
              <>
                <button
                  onClick={() => handleSocialLink('website')}
                  className="flex flex-col items-center gap-1.5 py-2 flex-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="rounded-full bg-background-light dark:bg-slate-700 p-2.5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                      language
                    </span>
                  </div>
                  <p className="text-[#0d131b] dark:text-slate-300 text-xs font-semibold">Website</p>
                </button>
                {(socialLinks.telegram || socialLinks.twitter) && (
                  <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
                )}
              </>
            )}
            {socialLinks.telegram && (
              <>
                <button
                  onClick={() => handleSocialLink('telegram')}
                  className="flex flex-col items-center gap-1.5 py-2 flex-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="rounded-full bg-background-light dark:bg-slate-700 p-2.5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                      send
                    </span>
                  </div>
                  <p className="text-[#0d131b] dark:text-slate-300 text-xs font-semibold">Telegram</p>
                </button>
                {socialLinks.twitter && (
                  <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
                )}
              </>
            )}
            {socialLinks.twitter && (
              <button
                onClick={() => handleSocialLink('twitter')}
                className="flex flex-col items-center gap-1.5 py-2 flex-1 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="rounded-full bg-background-light dark:bg-slate-700 p-2.5">
                  <svg className="w-5 h-5 fill-primary" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </div>
                <p className="text-[#0d131b] dark:text-slate-300 text-xs font-semibold">X.com</p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex overflow-x-auto gap-3 p-4 no-scrollbar">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Bullish %
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-[#0d131b] dark:text-white tracking-tight text-2xl font-extrabold leading-tight">
              {sentimentData?.bullishPercent || 50}%
            </p>
            <span className="text-bullish material-symbols-outlined text-sm font-bold">trending_up</span>
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Total Votes
          </p>
          <p className="text-[#0d131b] dark:text-white tracking-tight text-2xl font-extrabold leading-tight">
            {sentimentData?.totalVotes.toLocaleString() || '0'}
          </p>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Rank
          </p>
          <p className="text-[#0d131b] dark:text-white tracking-tight text-2xl font-extrabold leading-tight">
            #{sentimentData?.rank || '-'}
          </p>
        </div>
      </div>

      {/* SectionHeader: Community Sentiment */}
      <div className="px-4 pt-4">
        <h2 className="text-[#0d131b] dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Community Sentiment
        </h2>
        <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium">
          Real-time voting from verified TON wallets
        </p>
      </div>

      {/* Sentiment Bar & Voting */}
      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end mb-1">
            <div className="flex flex-col">
              <span className="text-bullish text-sm font-bold uppercase tracking-wide">Bullish</span>
              <span className="text-[#0d131b] dark:text-white text-lg font-black">
                {sentimentData?.bullishPercent || 50}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-bearish text-sm font-bold uppercase tracking-wide">Bearish</span>
              <span className="text-[#0d131b] dark:text-white text-lg font-black">
                {sentimentData?.bearishPercent || 50}%
              </span>
            </div>
          </div>
          {/* Sentiment Gauge */}
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-bullish transition-all duration-1000"
              style={{ width: `${sentimentData?.bullishPercent || 50}%` }}
            ></div>
            <div
              className="h-full bg-bearish transition-all duration-1000"
              style={{ width: `${sentimentData?.bearishPercent || 50}%` }}
            ></div>
          </div>
        </div>

        {/* Voting Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleVote('bullish')}
            disabled={voting !== null || (userVoteStatus?.hasVoted && !userVoteStatus?.canVote)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl py-4 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              userVoteStatus?.hasVoted && userVoteStatus.vote === 'bullish' && !userVoteStatus.canVote
                ? 'bg-bullish/50 border-2 border-bullish'
                : 'bg-bullish text-white shadow-bullish/20'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">
              {voting === 'bullish' ? 'hourglass_empty' : 
               userVoteStatus?.hasVoted && userVoteStatus.vote === 'bullish' ? 'check_circle' :
               'sentiment_very_satisfied'}
            </span>
            <span className="text-sm font-extrabold uppercase tracking-widest">
              {voting === 'bullish' ? 'Voting...' : 
               userVoteStatus?.hasVoted && userVoteStatus.vote === 'bullish' ? 'Voted' :
               'Bullish'}
            </span>
          </button>
          <button
            onClick={() => handleVote('bearish')}
            disabled={voting !== null || (userVoteStatus?.hasVoted && !userVoteStatus?.canVote)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl py-4 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              userVoteStatus?.hasVoted && userVoteStatus.vote === 'bearish' && !userVoteStatus.canVote
                ? 'bg-bearish/50 border-2 border-bearish'
                : 'bg-bearish text-white shadow-bearish/20'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">
              {voting === 'bearish' ? 'hourglass_empty' : 
               userVoteStatus?.hasVoted && userVoteStatus.vote === 'bearish' ? 'check_circle' :
               'sentiment_very_dissatisfied'}
            </span>
            <span className="text-sm font-extrabold uppercase tracking-widest">
              {voting === 'bearish' ? 'Voting...' : 
               userVoteStatus?.hasVoted && userVoteStatus.vote === 'bearish' ? 'Voted' :
               'Bearish'}
            </span>
          </button>
        </div>
        {voteError && (
          <p className="text-center text-[#e73908] dark:text-[#f85149] text-xs font-medium">
            {voteError}
          </p>
        )}
        {userVoteStatus?.hasVoted && !userVoteStatus.canVote && userVoteStatus.timeRemaining && (
          <p className="text-center text-[#4c6c9a] dark:text-slate-400 text-xs font-medium">
            You voted {userVoteStatus.vote}. Next vote in {Math.floor(userVoteStatus.timeRemaining / (60 * 60 * 1000))}h {Math.floor((userVoteStatus.timeRemaining % (60 * 60 * 1000)) / (60 * 1000))}m
          </p>
        )}
        {(!userVoteStatus?.hasVoted || userVoteStatus?.canVote) && (
          <p className="text-center text-[#4c6c9a] dark:text-slate-500 text-[11px] font-medium italic">
            <span className="material-symbols-outlined align-middle text-[14px] mr-1">info</span>
            Limited to 1 vote per user per 24h
          </p>
        )}
      </div>

      {/* Sentiment History Chart Section */}
      <div className="px-4 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#0d131b] dark:text-white text-xl font-extrabold leading-tight tracking-tight">
            Sentiment History
          </h2>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('1D')}
              className={`px-3 py-1 rounded text-xs font-bold ${
                timeRange === '1D'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-[#4c6c9a]'
              }`}
            >
              1D
            </button>
            <button
              onClick={() => setTimeRange('7D')}
              className={`px-3 py-1 rounded text-xs font-bold ${
                timeRange === '7D'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-[#4c6c9a]'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange('1M')}
              className={`px-3 py-1 rounded text-xs font-bold ${
                timeRange === '1M'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-[#4c6c9a]'
              }`}
            >
              1M
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="relative w-full h-48 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm overflow-hidden flex items-center justify-center">
          {(() => {
            const history = sentimentData?.history[timeRange] || [];
            if (history.length === 0) {
              // Show empty state when no historical data
              return (
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <span className="material-symbols-outlined text-4xl text-[#4c6c9a] dark:text-slate-500">show_chart</span>
                  <p className="text-sm font-bold text-[#4c6c9a] dark:text-slate-400">No historical data available</p>
                  <p className="text-xs text-[#4c6c9a] dark:text-slate-500">Historical sentiment data will appear here as voting activity increases</p>
                </div>
              );
            }

            // Generate chart path from history data
            const points = history.map((point, index) => {
              const x = (index / (history.length - 1)) * 100;
              const y = 100 - point.bullishPercent; // Invert Y axis (0% = bottom, 100% = top)
              return `${index === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ');

            const lastPoint = history[history.length - 1];
            const lastX = 100;
            const lastY = 100 - lastPoint.bullishPercent;

            return (
              <>
                {/* Grid Lines */}
                <div className="absolute inset-x-4 inset-y-8 flex flex-col justify-between opacity-30">
                  <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                  <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                  <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                </div>

                {/* Chart SVG */}
                <div className="absolute inset-0 pt-10 px-4 pb-12">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id={`chartFill-${address}`} x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#136dec', stopOpacity: 0.2 }}></stop>
                        <stop offset="100%" style={{ stopColor: '#136dec', stopOpacity: 0 }}></stop>
                      </linearGradient>
                    </defs>
                    <path
                      d={`${points} L${lastX},100 L0,100 Z`}
                      fill={`url(#chartFill-${address})`}
                    />
                    <path
                      d={points}
                      fill="none"
                      stroke="#136dec"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <circle cx={lastX} cy={lastY} fill="#136dec" r="3"></circle>
                    <circle cx={lastX} cy={lastY} fill="none" r="6" stroke="#136dec" strokeOpacity="0.3"></circle>
                  </svg>
                </div>

                {/* Axis Labels */}
                <div className="absolute bottom-3 inset-x-4 flex justify-between text-[10px] font-bold text-[#4c6c9a] uppercase tracking-tighter">
                  <span>Start</span>
                  <span>Now</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto px-4 py-8 flex flex-col items-center gap-2 opacity-50">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">terminal</span>
          <span className="text-xs font-black tracking-tighter uppercase">TMD Markets Terminal</span>
        </div>
        <p className="text-[10px] font-medium">v2.4.1-stable • TON Network</p>
      </div>
    </div>
  );
}
