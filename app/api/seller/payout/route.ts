import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Check user's available balance
    const wallet = sqlite.prepare(`
      SELECT balance FROM wallets WHERE user_id = ?
    `).get(user.id) as { balance: number } | undefined

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Check for existing pending payout requests
    const pendingRequest = sqlite.prepare(`
      SELECT id FROM payout_requests 
      WHERE user_id = ? AND status = 'pending'
    `).get(user.id)

    if (pendingRequest) {
      return NextResponse.json({ error: "You already have a pending payout request" }, { status: 400 })
    }

    // Create payout request
    const payoutId = randomUUID()
    const now = new Date().toISOString()
    
    sqlite.prepare(`
      INSERT INTO payout_requests (id, user_id, amount, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(payoutId, user.id, amount, 'pending', now)

    return NextResponse.json({ 
      id: payoutId, 
      status: 'pending',
      message: 'Payout request submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error("Failed to create payout request:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const payouts = sqlite.prepare(`
      SELECT * FROM payout_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(user.id)
    
    return NextResponse.json(payouts)
  } catch (error) {
    console.error("Failed to fetch payout requests:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 