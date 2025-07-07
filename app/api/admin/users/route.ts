import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user /* || user.role !== "admin" */) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: users, error } = await supabase.from('users').select('*')
    if (error) throw error;
    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch all users for admin:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 