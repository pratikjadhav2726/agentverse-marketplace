import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user /* || user.role !== "admin" */) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: agents, error } = await supabase.from('agents').select('*')
    if (error) throw error;
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Failed to fetch all agents for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 