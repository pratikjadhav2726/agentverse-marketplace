import { NextRequest, NextResponse } from "next/server"
import { sqlite } from "@/lib/database"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { role } = await req.json()

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = sqlite.prepare('SELECT id FROM users WHERE id = ?').get(id)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user role
    sqlite.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)

    return NextResponse.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Failed to update user role:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if user exists
    const existingUser = sqlite.prepare('SELECT id FROM users WHERE id = ?').get(id)
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user's wallet first (due to foreign key constraints)
    sqlite.prepare('DELETE FROM wallets WHERE user_id = ?').run(id)

    // Delete user's transactions
    sqlite.prepare('DELETE FROM credit_transactions WHERE from_user_id = ? OR to_user_id = ?').run(id, id)

    // Delete user's purchases
    sqlite.prepare('DELETE FROM purchases WHERE user_id = ?').run(id)

    // Delete user's reviews
    sqlite.prepare('DELETE FROM reviews WHERE user_id = ?').run(id)

    // Delete user's credentials
    sqlite.prepare('DELETE FROM user_credentials WHERE user_id = ?').run(id)

    // Delete user's agents
    sqlite.prepare('DELETE FROM agents WHERE owner_id = ?').run(id)

    // Finally, delete the user
    sqlite.prepare('DELETE FROM users WHERE id = ?').run(id)

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 