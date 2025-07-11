import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { sqlite } from "@/lib/database"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get date range from query params (default to last 30 days)
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Total earnings (all time)
    const totalEarnings = sqlite.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM credit_transactions 
      WHERE to_user_id = ? AND type = 'commission'
    `).get(user.id) as { total: number }

    // Earnings in date range
    const periodEarnings = sqlite.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM credit_transactions 
      WHERE to_user_id = ? AND type = 'commission' AND created_at >= ?
    `).get(user.id, startDate.toISOString()) as { total: number }

    // Total agents
    const totalAgents = sqlite.prepare(`
      SELECT COUNT(*) as count FROM agents WHERE owner_id = ?
    `).get(user.id) as { count: number }

    // Active agents (with purchases in last 30 days)
    const activeAgents = sqlite.prepare(`
      SELECT COUNT(DISTINCT a.id) as count
      FROM agents a
      JOIN purchases p ON a.id = p.agent_id
      WHERE a.owner_id = ? AND p.created_at >= ?
    `).get(user.id, startDate.toISOString()) as { count: number }

    // Total sales count
    const totalSales = sqlite.prepare(`
      SELECT COUNT(*) as count
      FROM purchases p
      JOIN agents a ON p.agent_id = a.id
      WHERE a.owner_id = ?
    `).get(user.id) as { count: number }

    // Sales in date range
    const periodSales = sqlite.prepare(`
      SELECT COUNT(*) as count
      FROM purchases p
      JOIN agents a ON p.agent_id = a.id
      WHERE a.owner_id = ? AND p.created_at >= ?
    `).get(user.id, startDate.toISOString()) as { count: number }

    // Top performing agents
    const topAgents = sqlite.prepare(`
      SELECT 
        a.id,
        a.name,
        a.price_per_use_credits,
        COUNT(p.id) as sales_count,
        COALESCE(SUM(ct.amount), 0) as earnings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM agents a
      LEFT JOIN purchases p ON a.id = p.agent_id
      LEFT JOIN credit_transactions ct ON a.id = ct.agent_id AND ct.type = 'commission'
      LEFT JOIN reviews r ON a.id = r.agent_id
      WHERE a.owner_id = ?
      GROUP BY a.id
      ORDER BY earnings DESC
      LIMIT 5
    `).all(user.id)

    // Monthly earnings trend (last 6 months)
    const monthlyTrend = sqlite.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        SUM(amount) as earnings
      FROM credit_transactions 
      WHERE to_user_id = ? AND type = 'commission'
      AND created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all(user.id)

    // Recent transactions
    const recentTransactions = sqlite.prepare(`
      SELECT 
        ct.*,
        a.name as agent_name,
        u.name as buyer_name
      FROM credit_transactions ct
      LEFT JOIN agents a ON ct.agent_id = a.id
      LEFT JOIN users u ON ct.from_user_id = u.id
      WHERE ct.to_user_id = ? AND ct.type = 'commission'
      ORDER BY ct.created_at DESC
      LIMIT 10
    `).all(user.id)

    // Payout requests
    const payoutRequests = sqlite.prepare(`
      SELECT * FROM payout_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 5
    `).all(user.id)

    return NextResponse.json({
      totalEarnings: totalEarnings.total,
      periodEarnings: periodEarnings.total,
      totalAgents: totalAgents.count,
      activeAgents: activeAgents.count,
      totalSales: totalSales.count,
      periodSales: periodSales.count,
      topAgents,
      monthlyTrend,
      recentTransactions,
      payoutRequests,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Failed to fetch seller analytics:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 