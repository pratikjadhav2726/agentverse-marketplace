import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { cancelAtPeriodEnd = true } = await request.json()

    if (cancelAtPeriodEnd) {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(params.id, {
        cancel_at_period_end: true,
      })
      return NextResponse.json({ subscription })
    } else {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(params.id)
      return NextResponse.json({ subscription })
    }
  } catch (error) {
    console.error("Failed to cancel subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
