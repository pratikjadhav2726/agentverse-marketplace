import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
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
  const payload = verifyJwt(token)
  if (!payload || !payload.id) {
    return null
  }
  const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.id).single();
  return user || null
} 