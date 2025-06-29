import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userTransactions = db.transactions.findForUser(user.id)
    return NextResponse.json(userTransactions)
  } catch (error) {
    console.error("Failed to fetch user transactions:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 