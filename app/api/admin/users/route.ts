import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const allUsers = db.users.getAll()
    // Make sure we don't leak sensitive info if there was any
    const safeUsers = allUsers.map(({ ...user }) => user)
    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error("Failed to fetch all users for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 