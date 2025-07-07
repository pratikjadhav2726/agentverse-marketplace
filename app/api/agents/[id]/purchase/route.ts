import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../../../lib/database';
import { Agent, Wallet, User } from '../../../../../lib/schema';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: agentId } = params;
    const body = await request.json();
    const { user_id, purchase_type } = body; // 'per_use', 'subscription', 'one_time'

    // Validate required fields
    if (!user_id || !purchase_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, purchase_type' },
        { status: 400 }
      );
    }

    // Validate purchase type
    if (!['per_use', 'subscription', 'one_time'].includes(purchase_type)) {
      return NextResponse.json(
        { error: 'Invalid purchase_type. Must be per_use, subscription, or one_time' },
        { status: 400 }
      );
    }

    // Get agent details
    const agent = sqlite.prepare('SELECT * FROM agents WHERE id = ? AND status = ?').get(agentId, 'active') as Agent;
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or inactive' }, { status: 404 });
    }

    // Get buyer details
    const buyer = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as User;
    
    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is trying to buy their own agent
    if (agent.owner_id === user_id) {
      return NextResponse.json({ error: 'Cannot purchase your own agent' }, { status: 400 });
    }

    // Get buyer's wallet
    const buyerWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user_id) as Wallet;
    
    if (!buyerWallet) {
      return NextResponse.json({ error: 'Buyer wallet not found' }, { status: 404 });
    }

    // Get seller's wallet
    const sellerWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(agent.owner_id) as Wallet;
    
    if (!sellerWallet) {
      return NextResponse.json({ error: 'Seller wallet not found' }, { status: 404 });
    }

    // Determine purchase price based on type
    let purchasePrice: number;
    
    switch (purchase_type) {
      case 'per_use':
        purchasePrice = agent.price_per_use_credits;
        break;
      case 'subscription':
        if (!agent.price_subscription_credits) {
          return NextResponse.json({ error: 'Subscription pricing not available for this agent' }, { status: 400 });
        }
        purchasePrice = agent.price_subscription_credits;
        break;
      case 'one_time':
        if (!agent.price_one_time_credits) {
          return NextResponse.json({ error: 'One-time pricing not available for this agent' }, { status: 400 });
        }
        purchasePrice = agent.price_one_time_credits;
        break;
      default:
        return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 });
    }

    // Check if buyer has enough credits
    if (buyerWallet.balance < purchasePrice) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        required: purchasePrice,
        available: buyerWallet.balance
      }, { status: 400 });
    }

    // Calculate commission (10% to platform)
    const platformCommission = Math.floor(purchasePrice * 0.1);
    const sellerAmount = purchasePrice - platformCommission;

    // Start transaction
    const purchaseId = 'purchase-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    try {
      // Begin transaction (SQLite doesn't support nested transactions, but we'll use a manual approach)
      
      // 1. Create purchase record
      sqlite.prepare(`
        INSERT INTO purchases (id, user_id, agent_id, purchase_type)
        VALUES (?, ?, ?, ?)
      `).run(purchaseId, user_id, agentId, purchase_type);

      // 2. Update buyer's wallet (deduct credits)
      sqlite.prepare('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(purchasePrice, user_id);

      // 3. Update seller's wallet (add credits minus commission)
      sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(sellerAmount, agent.owner_id);

      // 4. Create credit transaction record for purchase
      sqlite.prepare(`
        INSERT INTO credit_transactions (id, from_user_id, to_user_id, agent_id, amount, type, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        transactionId,
        user_id,
        agent.owner_id,
        agentId,
        purchasePrice,
        'purchase',
        JSON.stringify({
          purchase_type,
          purchase_id: purchaseId,
          platform_commission: platformCommission,
          seller_amount: sellerAmount
        })
      );

      // 5. Create commission transaction record if commission > 0
      if (platformCommission > 0) {
        const commissionTxId = 'commission-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sqlite.prepare(`
          INSERT INTO credit_transactions (id, from_user_id, agent_id, amount, type, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          commissionTxId,
          agent.owner_id,
          agentId,
          platformCommission,
          'commission',
          JSON.stringify({
            original_transaction: transactionId,
            purchase_id: purchaseId
          })
        );
      }

      // Get updated balances
      const updatedBuyerWallet = sqlite.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(user_id) as { balance: number };
      const updatedSellerWallet = sqlite.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(agent.owner_id) as { balance: number };

      return NextResponse.json({
        success: true,
        purchase: {
          id: purchaseId,
          agent_id: agentId,
          agent_name: agent.name,
          purchase_type,
          amount_paid: purchasePrice,
          transaction_id: transactionId
        },
        buyer_balance: updatedBuyerWallet.balance,
        seller_balance: updatedSellerWallet.balance
      }, { status: 201 });

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ error: 'Purchase transaction failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}