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
      return NextResponse.json({ paymentMethods: [] })
    }

    const customer = customers.data[0]
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: "card",
    })

    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : null,
      isDefault: pm.id === customer.invoice_settings.default_payment_method,
    }))

    return NextResponse.json({ paymentMethods: formattedMethods })
  } catch (error) {
    console.error("Failed to fetch payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json()

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find or create customer
    let customer
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

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    })

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add payment method:", error)
    return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 })
  }
}
