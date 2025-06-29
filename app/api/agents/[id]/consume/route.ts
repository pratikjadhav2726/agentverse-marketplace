import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

const RATE_LIMIT_COUNT = 5
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // --- Rate Limiter ---
  const agentId = params.id
  const endpoint = `/api/agents/${agentId}/consume`
  const usage = db.apiUsage.get(user.id, endpoint)

  const requestsInWindow =
    usage?.timestamps.filter((ts) => ts > Date.now() - RATE_LIMIT_WINDOW).length ?? 0

  if (requestsInWindow >= RATE_LIMIT_COUNT) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in an hour." },
      { status: 429 }
    )
  }
  // --- End Rate Limiter ---

  try {
    // If not rate-limited, record the request and proceed to charge the user
    db.apiUsage.record(user.id, endpoint)

    const agent = db.agents.find((a) => a.id === agentId)
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (user.credits < agent.pricing.amount) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Deduct credits from user
    const updatedUser = db.users.update(user.id, {
      credits: user.credits - agent.pricing.amount,
    })

    if (!updatedUser) {
      // Should not happen if user was found before
      throw new Error("Failed to update user credits.")
    }

    // Check if user has already purchased this agent, if not, create a record
    const existingPurchase = db.purchases.find(
      (p) => p.userId === user.id && p.agentId === agentId
    )
    if (!existingPurchase) {
      db.purchases.create({ userId: user.id, agentId: agentId })
    }

    // Give credits to the seller
    const seller = db.users.find((u) => u.id === agent.sellerId)
    if (!seller) {
      console.error("Seller not found for agent:", agent.id)
    } else {
      db.users.update(agent.sellerId, { credits: seller.credits + agent.pricing.amount })
      db.transactions.create({
        userId: agent.sellerId,
        type: "usage",
        agentId: agent.id,
        amount: agent.pricing.amount,
        description: `Earning from agent usage: ${agent.name}`,
        createdAt: new Date().toISOString(),
      })
    }

    // Create a transaction record for the user
    db.transactions.create({
      userId: user.id,
      type: "usage",
      agentId: agent.id,
      amount: -agent.pricing.amount,
      description: `Used agent: ${agent.name}`,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      message: "Agent used successfully",
      credits: updatedUser.credits,
    })
  } catch (error) {
    console.error("Agent consumption failed:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 