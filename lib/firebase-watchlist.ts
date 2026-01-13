import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export interface WatchlistItem {
  userId: string;
  tokenAddress: string;
  addedAt: Timestamp;
}

export interface Alert {
  userId: string;
  tokenAddress: string;
  type: 'price' | 'sentiment';
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AlertHistory {
  userId: string;
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
  type: 'price' | 'sentiment';
  action: 'enabled' | 'disabled';
  timestamp: Timestamp;
}

/**
 * Get user ID from Telegram WebApp or generate one
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  // Try to get Telegram WebApp user ID
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user?.id) {
    return `tg_${tg.initDataUnsafe.user.id}`;
  }

  // Fallback: generate and store a user ID in localStorage
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user-id', userId);
  }
  return userId;
}

/**
 * Add token to user's watchlist
 */
export async function addToWatchlist(tokenAddress: string, userId: string): Promise<void> {
  try {
    const watchlistRef = doc(db, 'watchlists', `${userId}_${tokenAddress.toLowerCase()}`);
    await setDoc(watchlistRef, {
      userId,
      tokenAddress: tokenAddress.toLowerCase(),
      addedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

/**
 * Remove token from user's watchlist
 */
export async function removeFromWatchlist(tokenAddress: string, userId: string): Promise<void> {
  try {
    const watchlistRef = doc(db, 'watchlists', `${userId}_${tokenAddress.toLowerCase()}`);
    await deleteDoc(watchlistRef);
  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

/**
 * Check if token is in user's watchlist
 */
export async function isInWatchlist(tokenAddress: string, userId: string): Promise<boolean> {
  try {
    const watchlistRef = doc(db, 'watchlists', `${userId}_${tokenAddress.toLowerCase()}`);
    const watchlistSnap = await getDoc(watchlistRef);
    return watchlistSnap.exists();
  } catch (error: any) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Get all tokens in user's watchlist
 */
export async function getUserWatchlist(userId: string): Promise<string[]> {
  try {
    const watchlistsRef = collection(db, 'watchlists');
    const q = query(watchlistsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const addresses: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as WatchlistItem;
      addresses.push(data.tokenAddress);
    });

    return addresses;
  } catch (error: any) {
    console.error('Error getting user watchlist:', error);
    return [];
  }
}

/**
 * Subscribe to user's watchlist changes
 */
export function subscribeToWatchlist(
  userId: string,
  callback: (addresses: string[]) => void
): Unsubscribe {
  const watchlistsRef = collection(db, 'watchlists');
  const q = query(watchlistsRef, where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const addresses: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as WatchlistItem;
        addresses.push(data.tokenAddress);
      });
      callback(addresses);
    },
    (error) => {
      console.error('Error subscribing to watchlist:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Set alert for a token
 */
export async function setAlert(
  tokenAddress: string,
  userId: string,
  type: 'price' | 'sentiment',
  enabled: boolean,
  tokenSymbol?: string,
  tokenName?: string
): Promise<void> {
  try {
    const alertRef = doc(db, 'alerts', `${userId}_${tokenAddress.toLowerCase()}_${type}`);
    const now = Timestamp.now();
    
    const alertData: Alert = {
      userId,
      tokenAddress: tokenAddress.toLowerCase(),
      type,
      enabled,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(alertRef, alertData, { merge: true });

    // Record alert history
    const historyRef = doc(collection(db, 'alertHistory'));
    const historyData: AlertHistory = {
      userId,
      tokenAddress: tokenAddress.toLowerCase(),
      tokenSymbol,
      tokenName,
      type,
      action: enabled ? 'enabled' : 'disabled',
      timestamp: now,
    };
    await setDoc(historyRef, historyData);
  } catch (error: any) {
    console.error('Error setting alert:', error);
    throw error;
  }
}

/**
 * Get alert history for a user
 */
export async function getAlertHistory(
  userId: string,
  limitCount: number = 50
): Promise<AlertHistory[]> {
  try {
    const historyRef = collection(db, 'alertHistory');
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const history: AlertHistory[] = [];
    querySnapshot.forEach((doc) => {
      history.push(doc.data() as AlertHistory);
    });

    return history;
  } catch (error: any) {
    console.error('Error getting alert history:', error);
    return [];
  }
}

/**
 * Get alert for a token
 */
export async function getAlert(
  tokenAddress: string,
  userId: string,
  type: 'price' | 'sentiment'
): Promise<boolean> {
  const alertRef = doc(db, 'alerts', `${userId}_${tokenAddress.toLowerCase()}_${type}`);
  const alertSnap = await getDoc(alertRef);
  
  if (!alertSnap.exists()) {
    return false;
  }

  const data = alertSnap.data() as Alert;
  return data.enabled;
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<Map<string, { price: boolean; sentiment: boolean }>> {
  try {
    const alertsRef = collection(db, 'alerts');
    const q = query(alertsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const alertsMap = new Map<string, { price: boolean; sentiment: boolean }>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Alert;
      const key = data.tokenAddress;
      
      if (!alertsMap.has(key)) {
        alertsMap.set(key, { price: false, sentiment: false });
      }
      
      const alerts = alertsMap.get(key)!;
      if (data.type === 'price') {
        alerts.price = data.enabled;
      } else {
        alerts.sentiment = data.enabled;
      }
    });

    return alertsMap;
  } catch (error: any) {
    console.error('Error getting user alerts:', error);
    return new Map();
  }
}
