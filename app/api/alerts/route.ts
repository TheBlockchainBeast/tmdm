import { NextResponse } from 'next/server';
import { setAlert, getAlert, getUserAlerts, getAlertHistory } from '@/lib/firebase-watchlist';

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
 * GET /api/alerts?userId=xxx&tokenAddress=xxx&type=price
 * Get user's alerts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const type = searchParams.get('type') as 'price' | 'sentiment' | null;
    const userId = getUserIdFromRequest(request);

    if (tokenAddress && type) {
      // Get specific alert
      const enabled = await getAlert(tokenAddress, userId, type);
      return NextResponse.json({ enabled });
    } else {
      // Get all alerts
      const alerts = await getUserAlerts(userId);
      const alertsObj: Record<string, { price: boolean; sentiment: boolean }> = {};
      alerts.forEach((value, key) => {
        alertsObj[key] = value;
      });
      return NextResponse.json({ alerts: alertsObj });
    }
  } catch (error: any) {
    console.error('Error getting alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get alerts' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/alerts
 * Set alert for a token
 * Body: { tokenAddress: string, type: 'price' | 'sentiment', enabled: boolean, userId: string, tokenSymbol?: string, tokenName?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenAddress, type, enabled, userId, tokenSymbol, tokenName } = body;

    if (!tokenAddress || !type || typeof enabled !== 'boolean' || !userId) {
      return NextResponse.json(
        { error: 'Missing tokenAddress, type, enabled, or userId' },
        { status: 400 }
      );
    }

    if (type !== 'price' && type !== 'sentiment') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "price" or "sentiment"' },
        { status: 400 }
      );
    }

    await setAlert(tokenAddress, userId, type, enabled, tokenSymbol, tokenName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting alert:', error);
    return NextResponse.json(
      { error: 'Failed to set alert' },
      { status: 500 }
    );
  }
}
