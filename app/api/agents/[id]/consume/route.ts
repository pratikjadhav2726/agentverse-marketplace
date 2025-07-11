import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/database";

const COMMISSION_RATE = 0.2; // 20%

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await request.json();
  const agentId = params.id;

  try {
    // 1. Fetch agent and seller
    const agent = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const price = agent.price_per_use_credits;
    const sellerId = agent.owner_id;
    const commission = Math.floor(price * COMMISSION_RATE);
    const sellerAmount = price - commission;

    // 2. Fetch user wallet
    const userWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
    if (!userWallet || userWallet.balance < price) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
    }

    // 3. Debit user
    sqlite.prepare('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(price, userId);

    // 4. Credit seller
    const sellerWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(sellerId) as any;
    if (!sellerWallet) {
      return NextResponse.json({ error: "Seller wallet not found" }, { status: 500 });
    }

    sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(sellerAmount, sellerId);

    // 5. Credit admin (commission)
    // Fetch admin user
    const adminUser = sqlite.prepare('SELECT id FROM users WHERE role = ?').get('admin') as any;
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 500 });
    }
    const adminId = adminUser.id;

    // Fetch admin wallet
    const adminWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(adminId) as any;
    if (!adminWallet) {
      return NextResponse.json({ error: "Admin wallet not found" }, { status: 500 });
    }

    sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(commission, adminId);

    // 6. Log transactions
    const transactionId1 = crypto.randomUUID();
    const transactionId2 = crypto.randomUUID();
    const transactionId3 = crypto.randomUUID();

    sqlite.prepare(`
      INSERT INTO credit_transactions (id, from_user_id, to_user_id, agent_id, amount, type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(transactionId1, userId, sellerId, agentId, -price, 'use', JSON.stringify({}));

    sqlite.prepare(`
      INSERT INTO credit_transactions (id, from_user_id, to_user_id, agent_id, amount, type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(transactionId2, userId, adminId, agentId, commission, 'commission', JSON.stringify({}));

    sqlite.prepare(`
      INSERT INTO credit_transactions (id, from_user_id, to_user_id, agent_id, amount, type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(transactionId3, userId, sellerId, agentId, sellerAmount, 'use', JSON.stringify({}));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing agent consumption:', error);
    return NextResponse.json({ error: "Failed to process consumption" }, { status: 500 });
  }
} 