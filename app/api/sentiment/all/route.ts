import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { getAllSentiments, getAggregateStats, initializeSentiments } from '@/lib/firebase-sentiment';
import { contracts } from '@/config/contracts';

/**
 * API route to get sentiment data for all tokens
 * GET /api/sentiment/all
 * Used for ranking and homepage stats
 */
export async function GET() {
  try {
    // Create cache key
    const cacheKey = 'sentiment:all';
    
    // Check cache first (30 second TTL)
    const cachedData = cache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Initialize sentiments for all contracts if needed (first time setup)
    await initializeSentiments(contracts);

    // Fetch all sentiment data from Firebase
    const sentiments = await getAllSentiments();
    
    // Get aggregate stats
    const stats = await getAggregateStats();

    const responseData = {
      tokens: sentiments,
      stats: {
        totalVotes24h: stats.totalVotes24h,
        bullishDominance: stats.bullishDominance,
        totalTokens: stats.totalTokens,
      },
    };

    // Cache the response for 30 seconds
    cache.set(cacheKey, responseData, 30);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching all sentiment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}
