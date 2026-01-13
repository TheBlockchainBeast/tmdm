import { NextResponse } from 'next/server';
import { contracts } from '@/config/contracts';
import { getMultipleTokenPairs, getBestPair } from '@/lib/dexscreener';
import { getMultipleJettonMetadata } from '@/lib/tonapi';
import { getWalletJettons, getTonBalance } from '@/lib/tonapi-portfolio';

/**
 * GET /api/portfolio?walletAddress=xxx
 * Get portfolio holdings for a wallet address
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Fetch wallet balances from TON API
    const [jettons, tonBalance, jettonMetadata, pairsMap] = await Promise.all([
      getWalletJettons(walletAddress),
      getTonBalance(walletAddress),
      getMultipleJettonMetadata(contracts),
      getMultipleTokenPairs('ton', contracts),
    ]);

    // Get TON price
    const tonPairs = await getMultipleTokenPairs('ton', ['TON']);
    const tonPair = tonPairs.get('ton')?.[0];
    const tonPrice = tonPair?.priceUsd ? parseFloat(tonPair.priceUsd) : 5.20;

    // Process holdings
    const holdings: Array<{
      address: string;
      symbol: string;
      name: string;
      balance: number;
      balanceInTon: number;
      price: number;
      priceChange24h: number;
      icon: string;
      decimals: number;
    }> = [];

    // Add TON native token (always show if balance > 0, even if very small)
    const tonBalanceNum = parseFloat(tonBalance);
    
    if (tonBalanceNum > 0) {
      holdings.push({
        address: 'TON',
        symbol: 'TON',
        name: 'Toncoin',
        balance: tonBalanceNum,
        balanceInTon: tonBalanceNum,
        price: tonPrice,
        priceChange24h: tonPair?.priceChange?.h24 || 0,
        icon: '/logo.jpg', // You might want to add a TON icon
        decimals: 9,
      });
    }

    // Process jetton balances
    for (const jetton of jettons) {
      const address = jetton.address.toLowerCase();
      const pairs = pairsMap.get(address) || [];
      const bestPair = getBestPair(pairs);
      const metadata = jettonMetadata.get(address);

      if (!bestPair || !bestPair.priceUsd) {
        continue; // Skip tokens without price data
      }

      const decimals = jetton.metadata?.decimals || metadata?.decimals || 9;
      const balanceRaw = BigInt(jetton.balance || '0');
      const balance = Number(balanceRaw) / Math.pow(10, decimals);
      const price = parseFloat(bestPair.priceUsd);
      const balanceInTon = balance * price / tonPrice;

      if (balance > 0) {
        holdings.push({
          address,
          symbol: jetton.metadata?.symbol || metadata?.symbol || 'TOKEN',
          name: jetton.metadata?.name || metadata?.name || 'Unknown Token',
          balance,
          balanceInTon,
          price,
          priceChange24h: bestPair.priceChange?.h24 || 0,
          icon: bestPair.info?.imageUrl || jetton.metadata?.image || metadata?.image || '/logo.jpg',
          decimals,
        });
      }
    }

    // Calculate totals
    const totalBalanceTon = holdings.reduce((sum, h) => sum + h.balanceInTon, 0);
    const totalBalanceUsd = holdings.reduce((sum, h) => sum + (h.balance * h.price), 0);

    return NextResponse.json({
      walletAddress,
      holdings,
      tonPrice,
      totalBalanceTon,
      totalBalanceUsd,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}
