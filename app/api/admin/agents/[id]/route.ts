import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database";
// import { db } from "@/lib/mock-db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)

  if (!user) {
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

    // Update agent status in the database
    const result = sqlite.prepare('UPDATE agents SET status = ? WHERE id = ?').run(status, agentId);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ id: agentId, status });
  } catch (error) {
    console.error(`Failed to update agent ${agentId}:`, error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 