# Contracts Configuration

This file contains the list of token contract addresses you want to track in TMD Markets.

## How to Add Contracts

1. Open `config/contracts.ts`
2. Simply add contract addresses as strings to the `contracts` array
3. All other data (symbol, name, price, etc.) will be automatically fetched from DexScreener

## Example

```typescript
export const contracts: string[] = [
  'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIo',
  'EQAnotherTokenAddressHere...',
  'EQYetAnotherTokenAddress...',
];
```

## Notes

- Only contract addresses are needed - everything else is fetched automatically
- Contract addresses should be valid TON blockchain addresses
- Token symbol, name, and price data come from DexScreener API
- Make sure the contract addresses are correct and have trading pairs on DEXs
- The app will automatically fetch and display token information
