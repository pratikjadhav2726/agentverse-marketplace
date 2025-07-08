import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');
    if (!user_id) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
    }
    const result = sqlite.prepare(
      `SELECT SUM(amount) as credits_earned FROM credit_transactions WHERE to_user_id = ? AND type = 'purchase'`
    ).get(user_id) as { credits_earned: number | null };
    return NextResponse.json({ credits_earned: result && result.credits_earned ? result.credits_earned : 0 });
  } catch (error) {
    console.error('Error fetching credits earned:', error);
    return NextResponse.json({ error: 'Failed to fetch credits earned' }, { status: 500 });
  }
} 