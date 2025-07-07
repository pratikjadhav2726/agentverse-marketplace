import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch purchases for the user
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('agent_id')
      .eq('user_id', user.id)
    if (purchasesError) throw purchasesError;
    const agentIds = purchases.map((p: any) => p.agent_id)
    if (agentIds.length === 0) return NextResponse.json([])
    // Fetch agents by IDs
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .in('id', agentIds)
    if (agentsError) throw agentsError;
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Failed to fetch purchased agents:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 