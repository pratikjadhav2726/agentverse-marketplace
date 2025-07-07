import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId, amount } = await request.json();

  // 1. Update wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    // If wallet doesn't exist, create it
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert([{ user_id: userId, balance: amount }])
      .select()
      .single();
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
  } else {
    // Update existing wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('user_id', userId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 2. Log transaction
  const { error: txError } = await supabase.from('credit_transactions').insert([
    {
      from_user_id: null,
      to_user_id: userId,
      amount,
      type: 'purchase',
      metadata: {},
    }
  ]);
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  return NextResponse.json({ success: true });
} 