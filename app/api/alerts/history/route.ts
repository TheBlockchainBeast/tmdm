import { NextResponse } from 'next/server';
import { getAlertHistory } from '@/lib/firebase-watchlist';

/**
 * Get user ID from request
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
 * GET /api/alerts/history?userId=xxx&limit=50
 * Get alert history for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const userId = getUserIdFromRequest(request);

    const history = await getAlertHistory(userId, limit);

    // Convert Firestore timestamps to ISO strings
    const historyData = history.map(item => ({
      ...item,
      timestamp: item.timestamp.toDate().toISOString(),
    }));

    return NextResponse.json({ history: historyData });
  } catch (error: any) {
    console.error('Error getting alert history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get alert history' },
      { status: 400 }
    );
  }
}
