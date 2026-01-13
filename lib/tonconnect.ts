/**
 * TON Connect integration
 * Documentation: https://docs.ton.org/develop/dapps/ton-connect/overview
 */

let tonConnect: any = null;

export async function initTonConnect() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { TonConnect } = await import('@tonconnect/sdk');
    
    if (!tonConnect) {
      tonConnect = new TonConnect({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      });
    }

    return tonConnect;
  } catch (error) {
    console.error('Failed to initialize TON Connect:', error);
    return null;
  }
}

export async function connectWallet() {
  const tc = await initTonConnect();
  if (!tc) {
    throw new Error('TON Connect not initialized');
  }

  try {
    const walletsList = await tc.getWallets();
    
    if (walletsList.length === 0) {
      throw new Error('No TON wallets found. Please install a TON wallet.');
    }

    // Open connection modal
    const provider = await tc.connect(walletsList);
    return provider;
  } catch (error: any) {
    if (error.message === 'User rejected') {
      throw new Error('Connection cancelled by user');
    }
    throw error;
  }
}

export async function disconnectWallet() {
  const tc = await initTonConnect();
  if (tc) {
    await tc.disconnect();
  }
}

export async function getConnectedWallet() {
  const tc = await initTonConnect();
  if (!tc) {
    return null;
  }

  try {
    const wallet = tc.wallet;
    return wallet || null;
  } catch (error) {
    return null;
  }
}

export function subscribeToWallet(callback: (wallet: any) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let unsubscribe: (() => void) | null = null;

  initTonConnect().then((tc) => {
    if (tc) {
      unsubscribe = tc.onStatusChange((wallet: any) => {
        callback(wallet);
      });
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
