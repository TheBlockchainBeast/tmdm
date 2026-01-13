/**
 * DexScreener API integration
 * Documentation: https://docs.dexscreener.com/
 */

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
    [key: string]: { buys: number; sells: number } | undefined;
  };
  volume: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
    [key: string]: number | undefined;
  };
  priceChange: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
    [key: string]: number | undefined;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ platform: string; handle: string }>;
  };
  boosts?: {
    active?: number;
  };
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

/**
 * Fetch token pairs data from DexScreener for a given token address
 * @param chainId - Chain identifier (e.g., 'ton', 'ethereum', 'bsc')
 * @param tokenAddress - Token contract address
 */
export async function getTokenPairs(
  chainId: string,
  tokenAddress: string
): Promise<DexScreenerPair[]> {
  try {
    const url = `https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      return [];
    }

    const data: DexScreenerResponse = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }
    
    return data.pairs;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch multiple token pairs at once using the efficient /tokens/v1/ endpoint
 * This endpoint supports up to 30 comma-separated addresses
 * @param chainId - Chain identifier
 * @param tokenAddresses - Array of token contract addresses
 */
export async function getMultipleTokenPairs(
  chainId: string,
  tokenAddresses: string[]
): Promise<Map<string, DexScreenerPair[]>> {
  const results = new Map<string, DexScreenerPair[]>();

  // Split into batches of 30 (API limit)
  const batchSize = 30;
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    const addressesParam = batch.join(',');

    try {
      const response = await fetch(
        `https://api.dexscreener.com/tokens/v1/${chainId}/${addressesParam}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 30 }, // Cache for 30 seconds
        }
      );

      if (!response.ok) {
        // Fallback to individual requests
        const fallbackPromises = batch.map(async (address) => {
          const pairs = await getTokenPairs(chainId, address);
          return { address, pairs };
        });
        const fallbackResponses = await Promise.all(fallbackPromises);
        fallbackResponses.forEach(({ address, pairs }) => {
          results.set(address.toLowerCase(), pairs);
        });
        continue;
      }

      const data: DexScreenerPair[] = await response.json();
      
      // Group pairs by token address
      data.forEach((pair) => {
        const tokenAddress = pair.baseToken.address.toLowerCase();
        if (!results.has(tokenAddress)) {
          results.set(tokenAddress, []);
        }
        results.get(tokenAddress)!.push(pair);
      });
    } catch (error) {
      // Fallback to individual requests for this batch
      const fallbackPromises = batch.map(async (address) => {
        const pairs = await getTokenPairs(chainId, address);
        return { address, pairs };
      });
      const fallbackResponses = await Promise.all(fallbackPromises);
      fallbackResponses.forEach(({ address, pairs }) => {
        results.set(address.toLowerCase(), pairs);
      });
    }
  }

  return results;
}

/**
 * Get the best pair (highest liquidity) from an array of pairs
 */
export function getBestPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
  if (!pairs || pairs.length === 0) return null;

  // Sort by liquidity (USD) descending, fallback to volume
  return pairs.sort((a, b) => {
    const liquidityA = a.liquidity?.usd || 0;
    const liquidityB = b.liquidity?.usd || 0;
    if (liquidityA !== liquidityB) {
      return liquidityB - liquidityA;
    }
    return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
  })[0];
}

/**
 * Format price change percentage
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Format large numbers (e.g., 1234567 -> "1.23M")
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}
