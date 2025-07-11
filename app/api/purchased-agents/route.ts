import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch purchases for the user
    const purchases = sqlite.prepare('SELECT agent_id FROM purchases WHERE user_id = ?').all(user.id) as { agent_id: string }[];
    
    if (purchases.length === 0) {
      return NextResponse.json([]);
    }
    
    const agentIds = purchases.map(p => p.agent_id);
    
    // Fetch agents by IDs using IN clause
    const placeholders = agentIds.map(() => '?').join(',');
    const agents = sqlite.prepare(`SELECT * FROM agents WHERE id IN (${placeholders})`).all(...agentIds);
    
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Failed to fetch purchased agents:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 