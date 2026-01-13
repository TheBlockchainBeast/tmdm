import { NextResponse } from 'next/server';
import { getTokenPairs, getBestPair } from '@/lib/dexscreener';
import { getJettonMetadata } from '@/lib/tonapi';
import { cache } from '@/lib/cache';

/**
 * API route to fetch a single token by address
 * GET /api/tokens/[address]
 * 
 * Query params:
 * - chainId: Optional chain identifier (default: 'ton')
 */
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') || 'ton';
    const address = params.address;

    if (!address) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `token:${chainId}:${address}`;
    
    // Check cache first (30 second TTL)
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Fetch token metadata from TON API
    const metadata = await getJettonMetadata(address);
    
    // Fetch pairs from DexScreener
    const pairs = await getTokenPairs(chainId, address);
    const bestPair = getBestPair(pairs);

    const tokenData = {
      address,
      pair: bestPair,
      pairs,
      metadata,
    };

    // Cache the response for 30 seconds
    cache.set(cacheKey, tokenData, 30);

    return NextResponse.json(tokenData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}
