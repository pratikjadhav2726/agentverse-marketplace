import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user /* || user.role !== "seller" */) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Failed to fetch seller transactions:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 