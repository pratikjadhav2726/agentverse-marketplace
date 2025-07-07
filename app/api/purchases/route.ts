import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    // Get purchases with agent details
    const purchases = sqlite.prepare(`
      SELECT 
        p.*,
        a.name as agent_name,
        a.description as agent_description,
        a.category as agent_category,
        a.price_per_use_credits as agent_price_per_use
      FROM purchases p
      LEFT JOIN agents a ON p.agent_id = a.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(user_id);

    // Transform the data to match the expected format
    const formattedPurchases = purchases.map((purchase: any) => ({
      id: purchase.id,
      user_id: purchase.user_id,
      agent_id: purchase.agent_id,
      purchase_type: purchase.purchase_type,
      created_at: purchase.created_at,
      agent: purchase.agent_name ? {
        id: purchase.agent_id,
        name: purchase.agent_name,
        description: purchase.agent_description,
        category: purchase.agent_category,
        price_per_use_credits: purchase.agent_price_per_use
      } : null
    }));

    return NextResponse.json({ purchases: formattedPurchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}