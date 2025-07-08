import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
// import { db } from "@/lib/mock-db"
import { sqlite } from "@/lib/database";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // const allAgents = db.agents.getAll()
  // const sellerAgents = allAgents.filter((agent) => agent.sellerId === user.id)

  // return NextResponse.json(sellerAgents)
  return NextResponse.json({ message: "GET endpoint is not yet implemented with Supabase" }, { status: 501 })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Basic validation
    if (!body.basic?.name || !body.pricing?.amount) {
      return NextResponse.json({ error: "Missing required fields: name and price" }, { status: 400 })
    }

    // Insert new agent with status 'pending'
    const agentId = randomUUID();
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO agents (
        id, owner_id, name, description, price_per_use_credits, price_subscription_credits, price_one_time_credits, status, created_at, category, tags, demo_url, documentation, requires_tools, tool_credits_per_use
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agentId,
      user.id,
      body.basic.name,
      body.basic.description || null,
      parseInt(body.pricing.amount, 10),
      null, // price_subscription_credits
      null, // price_one_time_credits
      'pending',
      now,
      body.basic.category || null,
      (body.basic.tags || []).join(","),
      null, // demo_url
      body.documentation.readme || null,
      (body.technical.capabilities || []).length > 0,
      1 // tool_credits_per_use (default)
    );

    // Optionally, insert agent_tools, etc. here if needed

    return NextResponse.json({ id: agentId, status: 'pending' }, { status: 201 })
  } catch (error) {
    console.error("Failed to create agent:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 