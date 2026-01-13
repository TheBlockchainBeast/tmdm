/**
 * TON API integration
 * Documentation: https://tonapi.io/
 */

export interface TONTokenInfo {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  description?: string;
}

export interface TONJettonMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
  description?: string;
}

/**
 * Fetch jetton (token) metadata from TON API
 * @param address - TON token contract address
 */
export async function getJettonMetadata(address: string): Promise<TONJettonMetadata | null> {
  try {
    // TON API endpoint for jetton metadata
    // Note: You may need an API key for production use
    const response = await fetch(
      `https://tonapi.io/v2/jettons/${address}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds (metadata changes less frequently)
      }
    );

    if (!response.ok) {
      // Try alternative endpoint format
      const altResponse = await fetch(
        `https://tonapi.io/v2/jettons/${address}/metadata`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
      );
      
      if (!altResponse.ok) {
        return null;
      }
      
      const altData = await altResponse.json();
      return altData.metadata || null;
    }

    const data = await response.json();
    
    // Extract metadata from response
    if (data.metadata) {
      return {
        address,
        name: data.metadata.name || '',
        symbol: data.metadata.symbol || '',
        decimals: data.metadata.decimals || 9,
        image: data.metadata.image,
        description: data.metadata.description,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch multiple jetton metadata at once
 */
export async function getMultipleJettonMetadata(
  addresses: string[]
): Promise<Map<string, TONJettonMetadata>> {
  const results = new Map<string, TONJettonMetadata>();

  // Fetch all metadata in parallel
  const promises = addresses.map(async (address) => {
    const metadata = await getJettonMetadata(address);
    return { address, metadata };
  });

  const responses = await Promise.all(promises);
  responses.forEach(({ address, metadata }) => {
    if (metadata) {
      results.set(address.toLowerCase(), metadata);
    }
  });

  return results;
}
