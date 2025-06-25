import { NextRequest } from "next/server"
import { db } from "./mock-db"
import type { User } from "./types"

/**
 * A server-side utility to get the user from a request.
 * In a real app, this would involve validating a session cookie or JWT.
 * For our mock setup, we'll check for a 'user-id' header.
 */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const userId = req.headers.get("user-id")

  if (!userId) {
    // For demonstration purposes, let's fall back to a default user if no header is present
    // In a real app, you'd likely return null or throw an error.
    const defaultUser = db.users.find((user) => user.role === "buyer")
    return defaultUser || null
  }

  const user = db.users.find((user) => user.id === userId)
  return user || null
} 