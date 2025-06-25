import { NextRequest, NextResponse } from "next/server"
import { addReviewForAgent, getAgentById } from "@/lib/mock-db"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agentId = params.id
  const body = await req.json()
  const { rating, comment } = body

  if (!rating || !comment) {
    return NextResponse.json({ error: "Missing rating or comment" }, { status: 400 })
  }

  // In a real app, you should verify that the user has purchased this agent
  // before allowing them to leave a review. We'll skip that for now.

  const agent = getAgentById(agentId)
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const newReview = addReviewForAgent(agentId, {
    user: user.name || "Anonymous",
    rating,
    comment,
  })

  return NextResponse.json(newReview, { status: 201 })
} 