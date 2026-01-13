/**
 * TON API integration for portfolio/wallet functionality
 * Documentation: https://tonapi.io/
 */

const TONAPI_BASE_URL = 'https://tonapi.io/v2';

/**
 * Convert raw hex address to user-friendly format (EQ...)
 * This is a simplified version - for production, consider using @ton/core
 * For now, we'll try the 0:hex format which TON API should accept
 */
function toUserFriendlyAddress(rawHex: string): string | null {
  try {
    // Remove 0: prefix if present
    const hex = rawHex.startsWith('0:') ? rawHex.substring(2) : rawHex;
    
    // Must be 64 hex characters
    if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
      return null;
    }

    // For now, we'll use the 0:hex format
    // Full EQ conversion requires base64 encoding with checksum which is complex
    // TON API should accept 0:hex format for both v4 and v5
    return `0:${hex}`;
  } catch (error) {
    return null;
  }
}

/**
 * Normalize wallet address for TON API
 * Handles v4/v5 wallet addresses and different formats
 * TON API accepts addresses in format: 0:hex, EQ... (bounceable), or UQ... (non-bounceable)
 * UQ addresses are user-friendly non-bounceable format (common for v5 wallets)
 * 
 * IMPORTANT: TON API CANNOT decode raw hex without 0: prefix!
 * Raw 64-char hex must be prefixed with "0:" to work with TON API
 */
function normalizeAddress(address: string): string {
  // If it's already in EQ or UQ format (user-friendly), return as is
  // Both formats are accepted by TON API
  if (address.startsWith('EQ') || address.startsWith('UQ')) {
    return address;
  }

  // If it already has 0: prefix and is 66 chars (0: + 64 hex), return as is
  if (address.startsWith('0:') && address.length === 66) {
    return address;
  }

  // Remove "0:" prefix if present to get raw hex
  let hex = address.startsWith('0:') ? address.substring(2) : address;
  
  // If it's a 64-character hex string (raw address), add 0: prefix
  // TON API REQUIRES addresses in format: 0:hex for raw addresses
  // Without the prefix, TON API returns: "can't decode address"
  if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
    return `0:${hex}`;
  }

  // Return as-is if format is unclear (might be invalid)
  return address;
}

/**
 * Get wallet jetton balances from TON API
 * Tries both the provided address and alternative formats
 * @param walletAddress - TON wallet address
 */
export async function getWalletJettons(walletAddress: string): Promise<Array<{
  address: string;
  balance: string;
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    image?: string;
  };
}>> {
  // Try multiple address formats for v4/v5 compatibility
  const addressFormats: string[] = [];
  
  // Add normalized format (handles EQ, UQ, 0:hex, and raw hex)
  const normalized = normalizeAddress(walletAddress);
  if (normalized && !addressFormats.includes(normalized)) {
    addressFormats.push(normalized);
  }
  
  // If original is raw hex without prefix, also try with prefix
  if (!walletAddress.startsWith('0:') && !walletAddress.startsWith('EQ') && !walletAddress.startsWith('UQ') && walletAddress.length === 64) {
    const withPrefix = `0:${walletAddress}`;
    if (!addressFormats.includes(withPrefix)) {
      addressFormats.unshift(withPrefix);
    }
  }
  
  // Add original format if different (for user-friendly addresses like UQ/EQ)
  if (walletAddress && !addressFormats.includes(walletAddress)) {
    addressFormats.push(walletAddress);
  }

  // Try each address format
  for (const address of addressFormats) {
    try {
      const response = await fetch(
        `${TONAPI_BASE_URL}/accounts/${address}/jettons`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 30 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Transform the response to our format
        const jettons = data.balances?.map((item: any) => ({
          address: item.jetton?.address || '',
          balance: item.balance || '0',
          metadata: item.jetton?.metadata ? {
            name: item.jetton.metadata.name,
            symbol: item.jetton.metadata.symbol,
            decimals: item.jetton.metadata.decimals,
            image: item.jetton.metadata.image,
          } : undefined,
        })) || [];

        return jettons;
      }
    } catch (error) {
      // Continue to next address format
    }
  }

  return [];
}

/**
 * Get wallet info to determine version and get balance
 * TON API v2/accounts endpoint should work for both v4 and v5
 * For v5 wallets, we need to check the account state properly
 * Also tries the /v2/blockchain/accounts/{address} endpoint as alternative
 */
async function getWalletInfo(address: string): Promise<{ balance: string; status?: string; interfaces?: string[]; state?: string } | null> {
  // Try standard accounts endpoint first
  try {
    const url = `${TONAPI_BASE_URL}/accounts/${address}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if balance exists and is valid
      // Balance can be 0, but we still want to return it
      // Even if balance is "0", we should return it so the caller knows the wallet exists
      if (data.balance !== undefined && data.balance !== null) {
        const balance = String(data.balance);
        return {
          balance: balance,
          status: data.status || data.account_state,
          state: data.state || data.account_state,
          interfaces: data.interfaces,
        };
      }
    }
  } catch (error) {
    // Continue to fallback endpoint
  }

  // Try blockchain/accounts endpoint as fallback (sometimes works better for v5)
  try {
    const url = `${TONAPI_BASE_URL}/blockchain/accounts/${address}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.balance !== undefined && data.balance !== null) {
        return {
          balance: data.balance || '0',
          status: data.status || data.account_state,
          state: data.state || data.account_state,
          interfaces: data.interfaces,
        };
      }
    }
  } catch (error) {
    // Return null if both endpoints fail
  }

  return null;
}

/**
 * Get TON native balance
 * Handles both v4 and v5 wallet addresses
 * For v5 wallets, balance might be in a different structure
 * @param walletAddress - TON wallet address (can be raw hex, 0:hex, or EQ format)
 */
export async function getTonBalance(walletAddress: string): Promise<string> {
  // Try multiple address formats for v4/v5 compatibility
  const addressFormats: string[] = [];
  
  // Add normalized format (handles EQ, UQ, 0:hex, and raw hex)
  const normalized = normalizeAddress(walletAddress);
  if (normalized && !addressFormats.includes(normalized)) {
    addressFormats.push(normalized);
  }
  
  // If original is raw hex without prefix, also try with prefix
  if (!walletAddress.startsWith('0:') && !walletAddress.startsWith('EQ') && !walletAddress.startsWith('UQ') && walletAddress.length === 64) {
    const withPrefix = `0:${walletAddress}`;
    if (!addressFormats.includes(withPrefix)) {
      addressFormats.unshift(withPrefix);
    }
  }
  
  // Add original format if different (for user-friendly addresses like UQ/EQ)
  if (walletAddress && !addressFormats.includes(walletAddress)) {
    addressFormats.push(walletAddress);
  }

  // Try each address format
  for (const address of addressFormats) {
    const walletInfo = await getWalletInfo(address);
    
    if (walletInfo) {
      // Check if wallet is active (not uninit)
      // For v5 wallets, status might be 'active' or 'uninit'
      // Balance should still be available even if uninit
      const balanceNano = walletInfo.balance || '0';
      
      // For v5 wallets, even if status is 'uninit', there might be balance
      // Try to get balance regardless of status
      // Convert balance even if it's "0" - we want to return the actual balance
      try {
        // Convert nanoTON to TON with proper decimal handling
        // BigInt division truncates, so we need to use Number for decimal precision
        const balanceNanoNum = Number(balanceNano);
        const balanceTon = balanceNanoNum / 1e9;
        
        // Return the balance as a string with decimal precision
        return balanceTon.toString();
      } catch (error) {
        return '0';
      }
    }
  }

  return '0';
}
