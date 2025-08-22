import Stripe from "stripe"

let serverStripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  serverStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  })
} else {
  if (process.env.NODE_ENV !== "production") {
    console.warn("STRIPE_SECRET_KEY is not set; Stripe features are disabled in this environment.")
  }
}

// Provide a safe stub to avoid crashes at import/build time
const stubStripe = {
  checkout: {
    sessions: {
      create: async () => {
        throw new Error("Stripe not configured")
      },
    },
  },
  customers: {
    search: async () => ({ data: [] }),
    create: async () => ({ id: "stub_customer" }),
  },
} as unknown as Stripe

export const stripe: Stripe = serverStripe ?? stubStripe

export const getStripe = () => {
  if (typeof window !== "undefined") {
    const stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    )
    return stripePromise
  }
  return null
}
