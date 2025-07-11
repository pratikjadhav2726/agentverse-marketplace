import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
// import { db } from "@/lib/mock-db"
import { sqlite } from "@/lib/database";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  console.log("Seller agents API - User:", user?.id, user?.email)

  if (!user) {
    console.log("Seller agents API - No user found")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const agents = sqlite.prepare(`
      SELECT 
        a.*,
        COUNT(DISTINCT p.id) as purchase_count,
        COUNT(DISTINCT r.id) as review_count,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COALESCE(SUM(CASE WHEN ct.type = 'commission' THEN ct.amount ELSE 0 END), 0) as total_earnings
      FROM agents a
      LEFT JOIN purchases p ON a.id = p.agent_id
      LEFT JOIN reviews r ON a.id = r.agent_id
      LEFT JOIN credit_transactions ct ON a.id = ct.agent_id AND ct.type = 'commission'
      WHERE a.owner_id = ?
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all(user.id);
    
    console.log("Seller agents API - Found agents:", agents.length)
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Failed to fetch seller agents:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
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