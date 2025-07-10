import { NextRequest, NextResponse } from "next/server"
import { sqlite } from "@/lib/database"

export async function GET(req: NextRequest) {
  // For now, we'll skip authentication to debug the database connection
  // const user = await getUserFromRequest(req)
  // if (!user || user.role !== "admin") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  try {
    // Fetch all users from SQLite database with their wallet balance
    const users = sqlite.prepare(`
      SELECT u.*, w.balance as credits 
      FROM users u 
      LEFT JOIN wallets w ON u.id = w.user_id 
      ORDER BY u.created_at DESC
    `).all()
    
    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch all users for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, password, credits } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = sqlite.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate ID for new user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Insert new user
    sqlite.prepare(`
      INSERT INTO users (id, email, name, role, password) 
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, name || null, role || 'user', password)

    // Create wallet for the user with initial credits
    const initialCredits = parseInt(credits) || 1000
    sqlite.prepare(`
      INSERT INTO wallets (user_id, balance) 
      VALUES (?, ?)
    `).run(userId, initialCredits)

    return NextResponse.json({ message: "User created successfully", id: userId })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 