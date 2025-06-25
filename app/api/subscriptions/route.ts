import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Find customer by userId
    const customers = await stripe.customers.list({
      metadata: { userId },
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ subscriptions: [] })
    }

    const customer = customers.data[0]
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      expand: ["data.default_payment_method"],
    })

    const formattedSubscriptions = subscriptions.data.map((sub) => ({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      agentId: sub.metadata.agentId,
      agentName: sub.items.data[0]?.price.product,
      amount: sub.items.data[0]?.price.unit_amount,
      currency: sub.items.data[0]?.price.currency,
    }))

    return NextResponse.json({ subscriptions: formattedSubscriptions })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
