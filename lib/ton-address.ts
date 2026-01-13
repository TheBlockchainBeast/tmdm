/**
 * TON Address utilities
 * Convert between different TON address formats
 */

/**
 * Convert raw hex address to TON user-friendly format (EQ...)
 * @param rawAddress - Raw hex address (with or without 0: prefix)
 */
export function toUserFriendlyAddress(rawAddress: string, bounceable: boolean = true, testOnly: boolean = false): string {
  // Remove 0: prefix if present
  let hex = rawAddress.startsWith('0:') ? rawAddress.substring(2) : rawAddress;
  
  // If it's already in EQ format, return as is
  if (hex.startsWith('EQ') || hex.startsWith('UQ')) {
    return hex;
  }

  // For now, try to use the address as-is or with 0: prefix
  // TON API should handle both formats
  // If it's a raw hex without prefix, add 0: prefix
  if (!hex.includes(':') && hex.length === 64) {
    return `0:${hex}`;
  }

  return hex;
}

/**
 * Convert address to format expected by TON API
 * TON API accepts both EQ and 0: formats
 */
export function normalizeForTonApi(address: string): string {
  // If it's already in EQ format, return as is
  if (address.startsWith('EQ') || address.startsWith('UQ')) {
    return address;
  }

  // Remove 0: prefix if present to get raw hex
  let hex = address.startsWith('0:') ? address.substring(2) : address;

  // If it's a 64-character hex string, it's likely a raw address
  // TON API can accept it with 0: prefix
  if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
    return `0:${hex}`;
  }

  // Return as-is if it doesn't match expected patterns
  return address;
}
