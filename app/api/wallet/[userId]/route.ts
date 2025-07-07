import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../../lib/database';
import { Wallet, User } from '../../../../lib/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get user details
    const user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get wallet details
    const wallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as Wallet;
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Get recent transactions
    const transactions = sqlite.prepare(`
      SELECT ct.*, 
             from_user.name as from_user_name,
             to_user.name as to_user_name,
             a.name as agent_name
      FROM credit_transactions ct
      LEFT JOIN users from_user ON ct.from_user_id = from_user.id
      LEFT JOIN users to_user ON ct.to_user_id = to_user.id
      LEFT JOIN agents a ON ct.agent_id = a.id
      WHERE ct.from_user_id = ? OR ct.to_user_id = ?
      ORDER BY ct.created_at DESC
      LIMIT 20
    `).all(userId, userId);

    return NextResponse.json({
      wallet,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      recent_transactions: transactions
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { amount, type = 'purchase' } = body; // type can be 'purchase', 'promo', etc.

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Get user details
    const user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create wallet
    let wallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as Wallet;
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const walletId = 'wallet-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      sqlite.prepare('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, ?)').run(walletId, userId, 0);
      wallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as Wallet;
    }

    // Add credits to wallet
    sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(amount, userId);

    // Create transaction record
    const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sqlite.prepare(`
      INSERT INTO credit_transactions (id, to_user_id, amount, type, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      transactionId,
      userId,
      amount,
      type,
      JSON.stringify({
        method: 'wallet_credit',
        description: `Added ${amount} credits to wallet`
      })
    );

    // Get updated wallet
    const updatedWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as Wallet;

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
      transaction: {
        id: transactionId,
        amount,
        type,
        new_balance: updatedWallet.balance
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
  }
}