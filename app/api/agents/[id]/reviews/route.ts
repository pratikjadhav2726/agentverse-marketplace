import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database"

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

  try {
    // Insert review into SQLite
    const reviewId = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO reviews (id, user_id, agent_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(reviewId, user.id, agentId, rating, comment);

    const newReview = sqlite.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
    
    if (!newReview) {
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
} 