import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/database";

export async function POST(request: NextRequest) {
  const { userId, amount } = await request.json();

  try {
    // 1. Check if wallet exists
    const wallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as { balance: number } | undefined;

    if (!wallet) {
      // If wallet doesn't exist, create it
      const walletId = crypto.randomUUID();
      sqlite.prepare('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, ?)').run(walletId, userId, amount);
    } else {
      // Update existing wallet
      sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(amount, userId);
    }

    // 2. Log transaction
    const transactionId = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO credit_transactions (id, from_user_id, to_user_id, amount, type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(transactionId, null, userId, amount, 'purchase', JSON.stringify({}));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
} 