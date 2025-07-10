import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  cookies().set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/"
  })
  return NextResponse.json({ message: "Logged out" })
} 