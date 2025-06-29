import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agentId = params.id
  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
  }

  try {
    const { status } = await req.json()
    if (!status || !["active", "rejected", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status provided" }, { status: 400 })
    }

    const updatedAgent = db.agents.update(agentId, { status })

    if (!updatedAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error(`Failed to update agent ${agentId}:`, error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 