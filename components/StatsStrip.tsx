'use client';

import { useEffect, useState } from 'react';
import StatsCard from './StatsCard';
import StatsCardSkeleton from './StatsCardSkeleton';

export default function StatsStrip() {
  const [totalMemes, setTotalMemes] = useState(0);
  const [totalVotes24h, setTotalVotes24h] = useState(0);
  const [bullishDominance, setBullishDominance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch both token count and sentiment stats
        const [tokensResponse, sentimentResponse] = await Promise.all([
          fetch('/api/tokens'),
          fetch('/api/sentiment/all'),
        ]);

        if (tokensResponse.ok) {
          const tokensData = await tokensResponse.json();
          // Use the total from pagination (total number of contracts configured)
          const count = tokensData.pagination?.total || 0;
          setTotalMemes(count);
        }

        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          setTotalVotes24h(sentimentData.stats?.totalVotes24h || 0);
          setBullishDominance(sentimentData.stats?.bullishDominance || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const stats = [
    {
      label: 'Total Memes',
      value: loading ? '...' : formatNumber(totalMemes),
      change: '0%',
      isPositive: true,
    },
    {
      label: '24h Votes',
      value: loading ? '...' : formatNumber(totalVotes24h),
      change: '0%',
      isPositive: true,
    },
    {
      label: 'Bullish Dom.',
      value: loading ? '...' : `${bullishDominance}%`,
      change: '0%',
      isPositive: true,
    },
  ];

  return (
    <div className="flex gap-2 sm:gap-3 p-4 bg-slate-50 dark:bg-slate-900/50">
      {loading ? (
        <>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </>
      ) : (
        stats.map((stat, index) => (
          <StatsCard
            key={index}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
          />
        ))
      )}
    </div>
  );
}
