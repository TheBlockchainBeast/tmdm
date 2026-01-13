import { NextResponse } from 'next/server';
import { addToWatchlist, removeFromWatchlist, getUserWatchlist } from '@/lib/firebase-watchlist';

/**
 * Get user ID from request headers or query params
 */
function getUserIdFromRequest(request: Request): string {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || request.headers.get('x-user-id');
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  return userId;
}

/**
 * GET /api/watchlist?userId=xxx
 * Get user's watchlist
 */
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const addresses = await getUserWatchlist(userId);
    
    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error('Error getting watchlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get watchlist' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add or remove token from watchlist
 * Body: { tokenAddress: string, action: 'add' | 'remove', userId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenAddress, action, userId } = body;

    if (!tokenAddress || !action || !userId) {
      return NextResponse.json(
        { error: 'Missing tokenAddress, action, or userId' },
        { status: 400 }
      );
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      await addToWatchlist(tokenAddress, userId);
    } else {
      await removeFromWatchlist(tokenAddress, userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}
