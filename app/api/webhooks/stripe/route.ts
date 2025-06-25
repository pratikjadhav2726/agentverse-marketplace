import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object)
        break
      case "checkout.session.completed":
        await handleCheckoutSuccess(event.data.object)
        break
      case "invoice.payment_succeeded":
        await handleSubscriptionPayment(event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler failed:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  // Handle successful one-time payment
  console.log("Payment succeeded:", paymentIntent.id)

  // Here you would:
  // 1. Create purchase record in database
  // 2. Grant access to the agent
  // 3. Send confirmation email
  // 4. Update user's purchased agents list
}

async function handleCheckoutSuccess(session: any) {
  // Handle successful subscription checkout
  console.log("Checkout completed:", session.id)

  // Here you would:
  // 1. Create subscription record in database
  // 2. Grant access to the agent
  // 3. Send welcome email
}

async function handleSubscriptionPayment(invoice: any) {
  // Handle recurring subscription payment
  console.log("Subscription payment succeeded:", invoice.id)
}

async function handleSubscriptionCancelled(subscription: any) {
  // Handle subscription cancellation
  console.log("Subscription cancelled:", subscription.id)

  // Here you would:
  // 1. Update subscription status in database
  // 2. Revoke access to the agent
  // 3. Send cancellation confirmation
}
