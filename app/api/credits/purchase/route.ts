import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
// import { db } from "@/lib/mock-db"

// 100 credits for $1
const CENTS_PER_CREDIT = 1

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, email } = await request.json()

    if (!userId || !amount || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const customer = await findOrCreateStripeCustomer(userId, email)

    const session = await stripe.checkout.sessions.create({
      customer,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "AgentVerse Credits",
              description: `Purchase ${amount} credits`,
            },
            unit_amount: amount * CENTS_PER_CREDIT,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.nextUrl.origin}/dashboard?purchase_success=true&amount=${amount}`,
      cancel_url: `${request.nextUrl.origin}/dashboard`,
      metadata: {
        userId,
        credits: amount,
        type: "credit_purchase",
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Credit purchase session creation failed:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

async function findOrCreateStripeCustomer(userId: string, email: string) {
  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create a new customer
  const newCustomer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Here you might want to update your user record with the new stripeCustomerId
  // For now, we just return the id.
  // Example: db.users.update({ where: { id: userId }, data: { stripeCustomerId: newCustomer.id } })

  return newCustomer.id
} 