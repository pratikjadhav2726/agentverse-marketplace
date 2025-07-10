import { NextResponse } from "next/server"
import { sqlite } from "@/lib/database"
import { signJwt } from "@/lib/utils"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email, name, role, password } = await request.json()
    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const existingUser = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }
    const id = crypto.randomUUID()
    const created_at = new Date().toISOString()
    sqlite.prepare('INSERT INTO users (id, email, name, role, password, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, email, name, role, password, created_at
    )
    const newUser = { id, email, name, role, created_at }
    const token = await signJwt({ id, email, role })
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/"
    })
    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 