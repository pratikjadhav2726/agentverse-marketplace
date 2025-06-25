import { NextResponse } from "next/server"
import { db } from "@/lib/mock-db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const purchases = db.purchases.findForUser(userId)
    const agents = db.agents.getAll()

    const purchasedAgents = purchases.map(purchase => {
      const agent = agents.find(a => a.id === purchase.agentId)
      return {
        id: purchase.purchaseId,
        agentId: purchase.agentId,
        userId: purchase.userId,
        purchaseDate: purchase.purchaseDate,
        status: "active", // Assuming all purchases are active for now
        agent: agent,
      }
    })

    return NextResponse.json({ purchasedAgents })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchased agents" }, { status: 500 })
  }
} 