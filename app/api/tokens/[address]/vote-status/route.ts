import { NextResponse } from 'next/server';
import { getUserVote } from '@/lib/firebase-sentiment';

/**
 * API route to check if a user has voted for a token
 * GET /api/tokens/[address]/vote-status?userId=...
 */
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!address) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's last vote
    const userVote = await getUserVote(address, userId);

    if (!userVote) {
      return NextResponse.json({
        hasVoted: false,
        canVote: true,
      });
    }

    // Check if vote is within 24 hours
    const voteTime = userVote.timestamp.toMillis();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const timeSinceVote = now - voteTime;
    const canVote = timeSinceVote >= twentyFourHours;

    return NextResponse.json({
      hasVoted: true,
      canVote,
      vote: userVote.vote,
      timestamp: userVote.timestamp.toMillis(),
      timeRemaining: canVote ? 0 : Math.max(0, twentyFourHours - timeSinceVote),
    });
  } catch (error: any) {
    console.error('Error checking vote status:', error);
    
    // If index is missing, return that user can vote (fail open)
    if (error.code === 'failed-precondition') {
      return NextResponse.json({
        hasVoted: false,
        canVote: true,
        note: 'Index not created - vote checking limited',
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}
