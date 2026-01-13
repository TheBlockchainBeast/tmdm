import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export interface SentimentData {
  address: string;
  bullishVotes: number;
  bearishVotes: number;
  totalVotes: number;
  bullishPercent: number;
  bearishPercent: number;
  rank: number;
  lastUpdated: Timestamp;
}

export interface Vote {
  tokenAddress: string;
  userId: string;
  vote: 'bullish' | 'bearish';
  timestamp: Timestamp;
}

/**
 * Get sentiment data for a specific token
 */
export async function getTokenSentiment(tokenAddress: string): Promise<SentimentData | null> {
  try {
    const sentimentRef = doc(db, 'sentiments', tokenAddress.toLowerCase());
    const sentimentSnap = await getDoc(sentimentRef);

    if (!sentimentSnap.exists()) {
      // Initialize with zero votes if doesn't exist
      const initialData: Omit<SentimentData, 'rank'> = {
        address: tokenAddress,
        bullishVotes: 0,
        bearishVotes: 0,
        totalVotes: 0,
        bullishPercent: 50,
        bearishPercent: 50,
        lastUpdated: Timestamp.now(),
      };
      await setDoc(sentimentRef, initialData);
      return { ...initialData, rank: 0 };
    }

    const data = sentimentSnap.data() as Omit<SentimentData, 'rank'>;
    return { ...data, rank: 0 }; // Rank will be calculated when fetching all
  } catch (error: any) {
    console.error('Error getting token sentiment:', error);
    throw error;
  }
}

/**
 * Get all sentiment data, sorted by total votes (for ranking)
 */
export async function getAllSentiments(): Promise<SentimentData[]> {
  try {
    const sentimentsRef = collection(db, 'sentiments');
    const q = query(sentimentsRef, orderBy('totalVotes', 'desc'));
    const querySnapshot = await getDocs(q);

    const sentiments: SentimentData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<SentimentData, 'rank'>;
      sentiments.push({
        ...data,
        rank: sentiments.length + 1, // Assign rank based on order
      });
    });

    return sentiments;
  } catch (error: any) {
    console.error('Error getting all sentiments:', error);
    throw error;
  }
}

/**
 * Get user's last vote for a token (if any)
 */
export async function getUserVote(
  tokenAddress: string,
  userId: string
): Promise<{ vote: 'bullish' | 'bearish'; timestamp: Timestamp } | null> {
  try {
    const votesRef = collection(db, 'votes');
    
    const q = query(
      votesRef,
      where('tokenAddress', '==', tokenAddress.toLowerCase()),
      where('userId', '==', userId.toLowerCase()),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const voteDoc = querySnapshot.docs[0];
    const data = voteDoc.data() as Vote;
    return {
      vote: data.vote,
      timestamp: data.timestamp,
    };
  } catch (error: any) {
    // If index is missing, return null (user hasn't voted or can't check)
    if (error.code === 'failed-precondition') {
      return null;
    }
    console.error('Error getting user vote:', error);
    throw error;
  }
}

/**
 * Check if a user has voted for a token in the last 24 hours
 */
export async function hasVotedRecently(
  tokenAddress: string,
  userId: string
): Promise<boolean> {
  try {
    const votesRef = collection(db, 'votes');
    const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      votesRef,
      where('tokenAddress', '==', tokenAddress.toLowerCase()),
      where('userId', '==', userId.toLowerCase()),
      where('timestamp', '>=', twentyFourHoursAgo),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking recent vote:', error);
    // If index is missing, allow the vote (fail open)
    if (error.code === 'failed-precondition') {
      return false;
    }
    throw error;
  }
}

/**
 * Submit a vote for a token
 */
export async function submitVote(
  tokenAddress: string,
  userId: string,
  vote: 'bullish' | 'bearish'
): Promise<{ success: boolean; message: string; sentiment?: SentimentData }> {
  try {
    // Check if user has voted recently
    const hasVoted = await hasVotedRecently(tokenAddress, userId);
    if (hasVoted) {
      return {
        success: false,
        message: 'You have already voted for this token in the last 24 hours',
      };
    }

    // Use batch write for atomicity
    const batch = writeBatch(db);

    // Add vote record
    const voteData: Vote = {
      tokenAddress: tokenAddress.toLowerCase(),
      userId: userId.toLowerCase(),
      vote,
      timestamp: Timestamp.now(),
    };
    
    const voteRef = doc(collection(db, 'votes'));
    batch.set(voteRef, voteData);

    // Update sentiment data
    const sentimentRef = doc(db, 'sentiments', tokenAddress.toLowerCase());
    const sentimentSnap = await getDoc(sentimentRef);

    let sentimentData: Omit<SentimentData, 'rank'>;
    if (sentimentSnap.exists()) {
      const current = sentimentSnap.data() as Omit<SentimentData, 'rank'>;
      const bullishVotes = vote === 'bullish' ? current.bullishVotes + 1 : current.bullishVotes;
      const bearishVotes = vote === 'bearish' ? current.bearishVotes + 1 : current.bearishVotes;
      const totalVotes = bullishVotes + bearishVotes;
      const bullishPercent = totalVotes > 0 ? Math.round((bullishVotes / totalVotes) * 100) : 50;
      const bearishPercent = 100 - bullishPercent;

      sentimentData = {
        address: tokenAddress,
        bullishVotes,
        bearishVotes,
        totalVotes,
        bullishPercent,
        bearishPercent,
        lastUpdated: Timestamp.now(),
      };
    } else {
      // Initialize new sentiment
      sentimentData = {
        address: tokenAddress,
        bullishVotes: vote === 'bullish' ? 1 : 0,
        bearishVotes: vote === 'bearish' ? 1 : 0,
        totalVotes: 1,
        bullishPercent: vote === 'bullish' ? 100 : 0,
        bearishPercent: vote === 'bearish' ? 100 : 0,
        lastUpdated: Timestamp.now(),
      };
    }

    batch.set(sentimentRef, sentimentData, { merge: true });

    // Commit batch
    await batch.commit();

    return {
      success: true,
      message: 'Vote recorded successfully',
      sentiment: { ...sentimentData, rank: 0 },
    };
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    
    if (error.code === 'permission-denied') {
      return {
        success: false,
        message: 'Database permissions not configured. Please set up Firestore security rules.',
      };
    }
    
    if (error.code === 'failed-precondition') {
      return {
        success: false,
        message: 'Database index required. Please create the composite index for votes collection.',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to submit vote. Please try again.',
    };
  }
}

/**
 * Get aggregate stats (total votes, bullish dominance)
 */
export async function getAggregateStats(): Promise<{
  totalVotes24h: number;
  bullishDominance: number;
  totalTokens: number;
}> {
  try {
    const sentiments = await getAllSentiments();
    const totalVotes24h = sentiments.reduce((sum, s) => sum + s.totalVotes, 0);
    const totalBullishVotes = sentiments.reduce((sum, s) => sum + s.bullishVotes, 0);
    const bullishDominance = totalVotes24h > 0
      ? Math.round((totalBullishVotes / totalVotes24h) * 100)
      : 50;

    return {
      totalVotes24h,
      bullishDominance,
      totalTokens: sentiments.length,
    };
  } catch (error) {
    console.error('Error getting aggregate stats:', error);
    return {
      totalVotes24h: 0,
      bullishDominance: 50,
      totalTokens: 0,
    };
  }
}

/**
 * Initialize sentiment data for all tokens (run once to set up)
 */
export async function initializeSentiments(tokenAddresses: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    for (const address of tokenAddresses) {
      const sentimentRef = doc(db, 'sentiments', address.toLowerCase());
      const sentimentSnap = await getDoc(sentimentRef);
      
      if (!sentimentSnap.exists()) {
        const initialData: Omit<SentimentData, 'rank'> = {
          address,
          bullishVotes: 0,
          bearishVotes: 0,
          totalVotes: 0,
          bullishPercent: 50,
          bearishPercent: 50,
          lastUpdated: Timestamp.now(),
        };
        batch.set(sentimentRef, initialData);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error initializing sentiments:', error);
  }
}

/**
 * Subscribe to real-time sentiment updates for a token
 * Returns an unsubscribe function
 */
export function subscribeToTokenSentiment(
  tokenAddress: string,
  callback: (sentiment: SentimentData | null) => void
): Unsubscribe | null {
  try {
    const sentimentRef = doc(db, 'sentiments', tokenAddress.toLowerCase());
    
    const unsubscribe = onSnapshot(
      sentimentRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Omit<SentimentData, 'rank'>;
          callback({ ...data, rank: 0 }); // Rank will be calculated separately
        } else {
          // Return default if doesn't exist
          callback({
            address: tokenAddress,
            bullishVotes: 0,
            bearishVotes: 0,
            totalVotes: 0,
            bullishPercent: 50,
            bearishPercent: 50,
            rank: 0,
            lastUpdated: Timestamp.now(),
          });
        }
      },
      (error) => {
        console.error('Error in sentiment snapshot:', error);
        callback(null);
      }
    );
    
    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up sentiment snapshot:', error);
    return null;
  }
}
