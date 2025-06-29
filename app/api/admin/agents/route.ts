import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const allAgents = db.agents.getAll()
    return NextResponse.json(allAgents)
  } catch (error) {
    console.error("Failed to fetch all agents for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 