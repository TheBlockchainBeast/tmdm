import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { getTokenSentiment, getAllSentiments } from '@/lib/firebase-sentiment';

/**
 * API route to get sentiment data for a token
 * GET /api/tokens/[address]/sentiment
 */
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    if (!address) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `sentiment:${address}`;
    
    // Check cache first (30 second TTL)
    const cachedData = cache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Get token sentiment from Firebase
    const sentimentData = await getTokenSentiment(address);
    
    if (!sentimentData) {
      return NextResponse.json(
        { error: 'Failed to fetch sentiment data' },
        { status: 500 }
      );
    }

    // Get rank from all sentiments
    const allSentiments = await getAllSentiments();
    const rankedSentiment = allSentiments.find(
      (s) => s.address.toLowerCase() === address.toLowerCase()
    );
    
    const finalSentiment = {
      ...sentimentData,
      rank: rankedSentiment?.rank || 0,
    };

    // No historical data available yet - return empty history
    // Historical data will be available once we implement time-series tracking
    const history = {
      '1D': [],
      '7D': [],
      '1M': [],
    };

    const responseData = {
      ...finalSentiment,
      history,
    };

    // Cache the response for 30 seconds
    cache.set(cacheKey, responseData, 30);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}

/**
 * API route to submit a vote
 * POST /api/tokens/[address]/sentiment
 */
export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const body = await request.json();
    const { vote, userId } = body; // vote: 'bullish' | 'bearish'

    if (!address) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    if (!vote || !['bullish', 'bearish'].includes(vote)) {
      return NextResponse.json(
        { error: 'Valid vote (bullish or bearish) is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Submit vote to Firebase (includes validation and update)
    const { submitVote, getAllSentiments } = await import('@/lib/firebase-sentiment');
    const result = await submitVote(address, userId, vote);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Get updated rank
    const allSentiments = await getAllSentiments();
    const rankedSentiment = allSentiments.find(
      (s) => s.address.toLowerCase() === address.toLowerCase()
    );

    // Clear cache to force refresh
    cache.delete('sentiment:all');
    cache.delete(`sentiment:${address}`);

    const responseData = {
      ...result.sentiment!,
      rank: rankedSentiment?.rank || 0,
      success: true,
      message: result.message,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
