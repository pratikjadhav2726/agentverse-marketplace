import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const wallet = sqlite.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId) as { balance: number } | undefined;

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  return NextResponse.json({ balance: wallet.balance });
} 