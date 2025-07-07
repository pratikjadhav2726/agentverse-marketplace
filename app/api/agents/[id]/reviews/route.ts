import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agentId = params.id
  const body = await req.json()
  const { rating, comment } = body

  if (!rating || !comment) {
    return NextResponse.json({ error: "Missing rating or comment" }, { status: 400 })
  }

  // In a real app, you should verify that the user has purchased this agent
  // before allowing them to leave a review. We'll skip that for now.

  // Insert review into Supabase
  const { data: newReview, error } = await supabase.from('reviews').insert([
    {
      user_id: user.id,
      agent_id: agentId,
      rating,
      comment,
    }
  ]).select().single();
  if (error || !newReview) {
    return NextResponse.json({ error: error?.message || "Failed to create review" }, { status: 500 })
  }

  return NextResponse.json(newReview, { status: 201 })
} 