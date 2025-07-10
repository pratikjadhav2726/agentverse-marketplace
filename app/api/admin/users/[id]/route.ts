import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)

  if (!user /* || user.role !== "admin" */) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = params.id
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const { role } = await req.json()
    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role provided" }, { status: 400 })
    }

    // Update user role in Supabase
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error || !updatedUser) {
      return NextResponse.json({ error: error?.message || "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 