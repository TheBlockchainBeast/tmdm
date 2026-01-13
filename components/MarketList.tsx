'use client';

import { useEffect, useState, useCallback } from 'react';
import MarketRow from './MarketRow';
import MarketRowSkeleton from './MarketRowSkeleton';
import ErrorState from './ErrorState';
import { formatPriceChange } from '@/lib/dexscreener';
import type { DexScreenerPair } from '@/lib/dexscreener';

interface Token {
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

interface MarketListProps {
  searchQuery?: string;
  sortBy?: 'votes' | 'priceChange' | 'bullish';
  minBullish?: number;
  showFavorites?: boolean;
}

export default function MarketList({
  searchQuery = '',
  sortBy = 'votes',
  minBullish = 0,
  showFavorites = false,
}: MarketListProps = {}) {
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const fetchTokenData = useCallback(async (currentOffset: number = 0, append: boolean = false, loadAll: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // If loadAll is true, fetch all tokens at once
      const fetchLimit = loadAll ? 1000 : limit;
      
      // Fetch both token data and sentiment data in parallel
      const [tokensResponse, sentimentResponse] = await Promise.all([
        fetch(`/api/tokens?limit=${fetchLimit}&offset=${currentOffset}`),
        fetch('/api/sentiment/all'),
      ]);
      
      if (!tokensResponse.ok) {
        const errorText = await tokensResponse.text().catch(() => 'Failed to fetch token data');
        throw new Error(errorText || 'Failed to fetch token data');
      }

      const data: { 
        tokens: TokenData[];
        pagination?: {
          limit: number;
          offset: number;
          total: number;
          hasMore: boolean;
        };
      } = await tokensResponse.json();

      // Get sentiment data
      let sentimentMap = new Map<string, { bullishPercent: number; bearishPercent: number; totalVotes: number; rank: number }>();
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        sentimentData.tokens?.forEach((sentiment: any) => {
          sentimentMap.set(sentiment.address.toLowerCase(), {
            bullishPercent: sentiment.bullishPercent,
            bearishPercent: sentiment.bearishPercent,
            totalVotes: sentiment.totalVotes,
            rank: sentiment.rank,
          });
        });
      }
        
        // Transform API data to Token format
        const transformedTokens: Token[] = data.tokens
          .map((tokenData) => {
            const pair = tokenData.pair;
            const metadata = tokenData.metadata;
            const sentiment = sentimentMap.get(tokenData.address.toLowerCase());
            
            // Get token symbol/name from TON API metadata first, then DexScreener, then fallback
            let symbol = metadata?.symbol || pair?.baseToken?.symbol;
            let tokenName = metadata?.name || pair?.baseToken?.name;
            // Get icon from DexScreener info.imageUrl, then TON API, then fallback
            let icon = pair?.info?.imageUrl || metadata?.image || '/logo.jpg';
            
            if (!symbol) {
              // Fallback: use shortened contract address as name
              const address = tokenData.address;
              symbol = address.length > 8 
                ? `${address.slice(0, 4)}...${address.slice(-4)}`
                : address;
            }
            
            // Calculate price change (24h) from DexScreener if available
            const priceChange24h = pair?.priceChange?.h24 || 0;
            const isPositive = priceChange24h >= 0;

            return {
              rank: sentiment?.rank || 0, // Will be recalculated after sorting
              name: symbol,
              icon,
              change: formatPriceChange(priceChange24h),
              isPositive,
              bullishPercent: sentiment?.bullishPercent || 50,
              bearishPercent: sentiment?.bearishPercent || 50,
              votes: sentiment?.totalVotes.toString() || '0',
              address: tokenData.address,
            };
          })
          .sort((a, b) => {
            // Sort by total votes (descending) - ranking by most votes
            const votesA = parseInt(a.votes) || 0;
            const votesB = parseInt(b.votes) || 0;
            return votesB - votesA;
          })
          .map((token, index) => ({
            ...token,
            rank: index + 1, // Recalculate rank after sorting
          }));

        if (append) {
          setAllTokens(prev => {
            const newTokens = [...prev, ...transformedTokens];
            return newTokens;
          });
        } else {
          setAllTokens(transformedTokens);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setOffset(currentOffset + transformedTokens.length);
        setError(null);
      } catch (err: any) {
        // Check if it's a network error
        const isNetworkError = err.message?.includes('Failed to fetch') || 
                              err.message?.includes('NetworkError') ||
                              !navigator.onLine;
        const errorMessage = isNetworkError 
          ? 'Network error. Please check your internet connection.' 
          : (err.message || 'Failed to load token data');
        setError(errorMessage);
        if (!append) {
          setTokens([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, []);

  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch favorites from Firebase
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Import getUserId dynamically to avoid SSR issues
        const { getUserId } = await import('@/lib/firebase-watchlist');
        const userId = getUserId();
        const response = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.addresses || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();

    // Listen for favorites changes
    const handleFavoritesChange = () => {
      fetchFavorites();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('favorites-changed', handleFavoritesChange);
      return () => {
        window.removeEventListener('favorites-changed', handleFavoritesChange);
      };
    }
  }, []);

  // Filter and sort tokens based on search, filters, and favorites
  useEffect(() => {
    let filtered = [...allTokens];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((token) =>
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    }

    // Apply favorites filter
    if (showFavorites) {
      filtered = filtered.filter((token) =>
        favorites.includes(token.address.toLowerCase())
      );
    }

    // Apply minimum bullish filter
    if (minBullish > 0) {
      filtered = filtered.filter((token) => token.bullishPercent >= minBullish);
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priceChange':
          const changeA = parseFloat(a.change.replace(/[^0-9.-]/g, '')) || 0;
          const changeB = parseFloat(b.change.replace(/[^0-9.-]/g, '')) || 0;
          return changeB - changeA;
        case 'bullish':
          return b.bullishPercent - a.bullishPercent;
        case 'votes':
        default:
          const votesA = parseInt(a.votes) || 0;
          const votesB = parseInt(b.votes) || 0;
          return votesB - votesA;
      }
    });

    // Recalculate ranks after filtering/sorting
    const rankedTokens = filtered.map((token, index) => ({
      ...token,
      rank: index + 1,
    }));

    setTokens(rankedTokens);
  }, [allTokens, searchQuery, sortBy, minBullish, showFavorites, favorites]);

  // Listen for favorites changes to update the filtered list
  useEffect(() => {
    const handleFavoritesChange = () => {
      // Force re-render by updating a dummy state or re-triggering the filter effect
      // The filter effect will automatically run when showFavorites changes
      if (showFavorites) {
        // Re-trigger filtering by updating allTokens reference
        setAllTokens((prev) => [...prev]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('favorites-changed', handleFavoritesChange);
      return () => {
        window.removeEventListener('favorites-changed', handleFavoritesChange);
      };
    }
  }, [showFavorites]);

  // Load all tokens when filters are active
  useEffect(() => {
    const shouldLoadAll = Boolean(searchQuery || showFavorites || minBullish > 0);
    if (shouldLoadAll && allTokens.length === 0) {
      fetchTokenData(0, false, true);
    }
  }, [searchQuery, showFavorites, minBullish, allTokens.length, fetchTokenData]);

  useEffect(() => {
    // Initial load - load all tokens so search/filter works immediately
    // Since we only have ~12 tokens, this is fine
    fetchTokenData(0, false, true);
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchTokenData(0, false, true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTokenData]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTokenData(offset, true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 10 }).map((_, index) => (
          <MarketRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => fetchTokenData(0, false, true)}
      />
    );
  }

  if (tokens.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-[#4c6c9a] dark:text-slate-400 text-sm">
          {searchQuery || showFavorites || minBullish > 0
            ? 'No tokens match your filters'
            : 'No tokens found'}
        </div>
        {(searchQuery || showFavorites || minBullish > 0) && (
          <button
            onClick={() => {
              // This will be handled by parent component
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {tokens.map((token) => (
        <MarketRow key={`${token.rank}-${token.name}`} {...token} />
      ))}
      
      {/* Load More Button - Only show when no filters are active */}
      {hasMore && !searchQuery && !showFavorites && minBullish === 0 && (
        <div className="px-4 py-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      
      {(!hasMore || searchQuery || showFavorites || minBullish > 0) && tokens.length > 0 && (
        <div className="px-4 py-6 flex justify-center">
          <p className="text-[#4c6c9a] dark:text-slate-400 text-sm">
            {searchQuery || showFavorites || minBullish > 0
              ? `Showing ${tokens.length} result${tokens.length !== 1 ? 's' : ''}`
              : 'No more tokens to load'}
          </p>
        </div>
      )}
    </div>
  );
}
