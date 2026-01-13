import { NextResponse } from 'next/server';
import { contracts } from '@/config/contracts';
import { getMultipleTokenPairs, getBestPair } from '@/lib/dexscreener';
import { getMultipleJettonMetadata } from '@/lib/tonapi';
import { cache } from '@/lib/cache';

/**
 * API route to fetch token data from DexScreener
 * GET /api/tokens
 * 
 * Query params:
 * - chainId: Optional chain identifier (default: 'ton')
 *   Common values: 'ethereum', 'bsc', 'polygon', 'solana', 'ton', 'base', 'arbitrum'
 * 
 * Cached for 30 seconds to improve performance
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // For TON blockchain, try different chain identifiers
    // DexScreener might use: 'ton', 'the-open-network', or check their docs
    let chainId = searchParams.get('chainId') || 'ton';
    
    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all contract addresses (filter out empty addresses)
    const allTokenAddresses = contracts.filter((addr) => addr && addr.trim().length > 0);

    if (allTokenAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No contract addresses configured. Please add contracts in config/contracts.ts' },
        { status: 400 }
      );
    }

    // Apply pagination
    const tokenAddresses = allTokenAddresses.slice(offset, offset + limit);
    const hasMore = offset + limit < allTokenAddresses.length;

    // Create cache key based on addresses, chainId, limit, and offset
    const cacheKey = `tokens:${chainId}:${offset}:${limit}:${tokenAddresses.sort().join(',')}`;
    
    // Check cache first (30 second TTL)
    const cachedData = cache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Fetch token metadata from TON API (since DexScreener doesn't support TON)
    const jettonMetadata = await getMultipleJettonMetadata(tokenAddresses);
    
    // Also try DexScreener (in case it starts supporting TON in the future)
    const pairsMap = await getMultipleTokenPairs(chainId, tokenAddresses);

    // Map to token data with best pair
    // Token info comes from TON API, price data from DexScreener (if available)
    const tokensData = tokenAddresses.map((address) => {
      const pairs = pairsMap.get(address.toLowerCase()) || [];
      const bestPair = getBestPair(pairs);
      const metadata = jettonMetadata.get(address.toLowerCase());

      return {
        address,
        pair: bestPair,
        pairs,
        metadata, // TON API metadata
      };
    });

    const tokensWithData = tokensData.filter(t => t.pair !== null).length;
    const tokensWithoutData = tokensData.filter(t => t.pair === null).length;

    const responseData = {
      tokens: tokensData,
      chainId,
      pagination: {
        limit,
        offset,
        total: allTokenAddresses.length,
        hasMore,
      },
      timestamp: new Date().toISOString(),
      stats: {
        total: tokensData.length,
        withData: tokensWithData,
        withoutData: tokensWithoutData,
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
    return NextResponse.json(
      { error: 'Failed to fetch token data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
