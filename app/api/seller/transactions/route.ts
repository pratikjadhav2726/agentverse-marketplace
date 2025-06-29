import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden: User is not a seller" }, { status: 403 })
  }

  try {
    const sellerTransactions = db.transactions.findForUser(user.id)
    return NextResponse.json(sellerTransactions)
  } catch (error) {
    console.error("Failed to fetch seller transactions:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 