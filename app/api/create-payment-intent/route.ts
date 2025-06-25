import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const { agentId, amount, currency, agentName, userId, type } = await request.json()

    if (!agentId || !amount || !currency || !agentName || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create or retrieve customer
    let customer
    try {
      const customers = await stripe.customers.list({
        metadata: { userId },
        limit: 1,
      })

      if (customers.data.length > 0) {
        customer = customers.data[0]
      } else {
        customer = await stripe.customers.create({
          metadata: { userId },
        })
      }
    } catch (error) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    if (type === "subscription") {
      // Create subscription checkout
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: agentName,
                description: `AI Agent: ${agentName}`,
              },
              unit_amount: amount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${request.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.nextUrl.origin}/agents/${agentId}`,
        metadata: {
          agentId,
          userId,
          type: "subscription",
        },
      })

      return NextResponse.json({ sessionId: session.id, type: "subscription" })
    } else {
      // Create one-time payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer.id,
        metadata: {
          agentId,
          userId,
          agentName,
          type: "one-time",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        type: "one-time",
      })
    }
  } catch (error) {
    console.error("Payment intent creation failed:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
