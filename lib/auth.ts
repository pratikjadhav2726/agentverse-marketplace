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
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  const token = authHeader.slice(7)
  const payload = await verifyJwt(token)
  if (!payload || !payload.id) {
    return null
  }
  const user = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(payload.id) as User | undefined;
  return user || null
} 