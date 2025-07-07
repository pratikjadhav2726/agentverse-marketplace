import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COMMISSION_RATE = 0.2; // 20%

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await request.json();
  const agentId = params.id;

  // 1. Fetch agent and seller
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();
  if (agentError || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const price = agent.price_per_use_credits;
  const sellerId = agent.owner_id;
  const commission = Math.floor(price * COMMISSION_RATE);
  const sellerAmount = price - commission;

  // 2. Fetch user wallet
  const { data: userWallet, error: userWalletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (userWalletError || !userWallet || userWallet.balance < price)
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });

  // 3. Debit user, credit seller, credit admin (commission)
  const { error: debitError } = await supabase
    .from('wallets')
    .update({ balance: userWallet.balance - price })
    .eq('user_id', userId);
  if (debitError) return NextResponse.json({ error: debitError.message }, { status: 500 });

  // Credit seller
  const { data: sellerWallet, error: sellerWalletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', sellerId)
    .single();
  if (sellerWalletError || !sellerWallet)
    return NextResponse.json({ error: "Seller wallet not found" }, { status: 500 });

  const { error: creditError } = await supabase
    .from('wallets')
    .update({ balance: sellerWallet.balance + sellerAmount })
    .eq('user_id', sellerId);
  if (creditError) return NextResponse.json({ error: creditError.message }, { status: 500 });

  // Credit admin (commission)
  // Fetch admin user
  const { data: adminUser, error: adminUserError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();
  if (adminUserError || !adminUser) {
    return NextResponse.json({ error: "Admin user not found" }, { status: 500 });
  }
  const adminId = adminUser.id;
  // Fetch admin wallet
  const { data: adminWallet, error: adminWalletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', adminId)
    .single();
  if (adminWalletError || !adminWallet) {
    return NextResponse.json({ error: "Admin wallet not found" }, { status: 500 });
  }
  const { error: adminCreditError } = await supabase
    .from('wallets')
    .update({ balance: adminWallet.balance + commission })
    .eq('user_id', adminId);
  if (adminCreditError) return NextResponse.json({ error: adminCreditError.message }, { status: 500 });

  // Log transactions
  await supabase.from('credit_transactions').insert([
    {
      from_user_id: userId,
      to_user_id: sellerId,
      agent_id: agentId,
      amount: -price,
      type: 'use',
      metadata: {},
    },
    {
      from_user_id: userId,
      to_user_id: adminId,
      agent_id: agentId,
      amount: commission,
      type: 'commission',
      metadata: {},
    },
    {
      from_user_id: userId,
      to_user_id: sellerId,
      agent_id: agentId,
      amount: sellerAmount,
      type: 'use',
      metadata: {},
    }
  ]);

  return NextResponse.json({ success: true });
} 