import { NextResponse } from "next/server"
import { sqlite } from "@/lib/database"
import { signJwt } from "@/lib/utils"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const user = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email) as {
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
      password: string;
    } | undefined;
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const { password: _pw, ...userWithoutPassword } = user
    const token = await signJwt({ id: user.id, email: user.email, role: user.role })
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/"
    })
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 