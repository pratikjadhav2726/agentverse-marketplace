import { NextResponse } from "next/server"
import { db } from "@/lib/mock-db"

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = db.users.find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const newUser = db.users.create({ email, name, role })

    // Don't send the password back to the client
    const { ...userWithoutPassword } = newUser

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 