import { NextRequest, NextResponse } from "next/server"
import { sqlite } from "@/lib/database"
import { verifyJwt } from "@/lib/utils"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const token = cookies().get("auth_token")?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  const payload = await verifyJwt(token)
  if (!payload || !payload.id) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  const user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(payload.id) as {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    password: string;
  } | undefined;
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  const { password: _pw, ...userWithoutPassword } = user
  return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
} 