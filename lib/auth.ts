import { NextRequest } from "next/server"
import { sqlite } from "@/lib/database"
import type { User } from "./types"
import { verifyJwt } from "@/lib/utils"

/**
 * A server-side utility to get the user from a request.
 * In a real app, this would involve validating a session cookie or JWT.
 * For our mock setup, we'll check for a 'user-id' header.
 */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  // Try to get token from Authorization header first
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
  let token: string | null = null
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7)
  } else {
    // Try to get token from cookies
    const cookies = req.cookies
    token = cookies.get("auth_token")?.value || null
  }
  
  if (!token) {
    return null
  }
  
  try {
    const payload = await verifyJwt(token)
    if (!payload || !payload.id) {
      return null
    }
    const user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(payload.id) as User | undefined;
    return user || null
  } catch (error) {
    console.error("Error verifying JWT:", error)
    return null
  }
} 