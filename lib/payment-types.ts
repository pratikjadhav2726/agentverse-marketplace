export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
  agentId: string
  userId: string
  metadata: {
    agentName: string
    agentType: "one-time" | "subscription"
  }
}

export interface Subscription {
  id: string
  customerId: string
  priceId: string
  status: string
  currentPeriodStart: number
  currentPeriodEnd: number
  agentId: string
  userId: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}
