import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user /* || user.role !== "seller" */) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const transactions = sqlite.prepare(`
      SELECT * FROM credit_transactions 
      WHERE from_user_id = ? OR to_user_id = ?
      ORDER BY created_at DESC
    `).all(user.id, user.id);
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Failed to fetch seller transactions:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 