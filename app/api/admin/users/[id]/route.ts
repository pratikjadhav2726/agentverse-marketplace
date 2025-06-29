import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = params.id
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const { role } = await req.json()
    if (!role || !["admin", "seller", "buyer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role provided" }, { status: 400 })
    }

    // Prevent admin from accidentally demoting themselves if they are the only admin
    if (user.id === userId && user.role === "admin") {
      const allUsers = db.users.getAll()
      const adminCount = allUsers.filter((u) => u.role === "admin").length
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last admin." }, { status: 400 })
      }
    }

    const updatedUser = db.users.update(userId, { role })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 