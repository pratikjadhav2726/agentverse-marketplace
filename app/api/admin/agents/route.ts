import { NextRequest, NextResponse } from "next/server"
import { sqlite } from "@/lib/database"

export async function GET(req: NextRequest) {
  // For now, we'll skip authentication to debug the database connection
  // const user = await getUserFromRequest(req)
  // if (!user || user.role !== "admin") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  try {
    // Fetch all agents from SQLite database
    const agents = sqlite.prepare(`
      SELECT a.*, u.name as creator 
      FROM agents a 
      LEFT JOIN users u ON a.owner_id = u.id 
      ORDER BY a.created_at DESC
    `).all()
    
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Failed to fetch all agents for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 