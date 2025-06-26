import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mock-db"
import type { Agent, User } from "@/lib/types"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const agent = db.agents.find((a) => a.id === agentId)
    const user = db.users.find((u) => u.id === userId)
    const seller = db.users.find((u) => u.id === agent?.sellerId)

    if (!agent || !user || !seller) {
      return NextResponse.json({ error: "Invalid agent, user, or seller" }, { status: 404 })
    }

    if (agent.pricing.currency !== "credits") {
      return NextResponse.json({ error: "This agent cannot be consumed with credits" }, { status: 400 })
    }

    const cost = agent.pricing.amount

    if (user.credits < cost) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    // Perform the transaction
    db.users.update(userId, { credits: user.credits - cost })
    db.users.update(seller.id, { credits: seller.credits + cost })

    // Log transactions
    db.transactions.create({
      userId,
      type: "usage",
      amount: -cost,
      currency: "credits",
      description: `Used agent: ${agent.name}`,
      relatedId: agentId,
      createdAt: new Date(),
    })

    db.transactions.create({
      userId: seller.id,
      type: "earning",
      amount: cost,
      currency: "credits",
      description: `Sale of agent: ${agent.name} to user: ${user.name}`,
      relatedId: agentId,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: `Successfully consumed agent ${agent.name}` })
  } catch (error) {
    console.error("Agent consumption failed:", error)
    return NextResponse.json({ error: "Failed to consume agent" }, { status: 500 })
  }
} 