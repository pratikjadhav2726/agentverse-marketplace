export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "seller" | "buyer"
  credits: number
  createdAt: Date
  updatedAt: Date
  stripeCustomerId?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  creator: string
  capabilities: string[]
  pricing: Pricing
  sellerId: string
  status: "pending" | "approved" | "active" | "suspended" | "rejected" | "draft"
  a2aEndpoint: string
  dockerImage?: string
  metadata: Record<string, any>
  ratings: {
    average: number
    count: number
  }
  reviews: Review[]
  documentation: string
  examples: Array<{ input: any; output: any; description: string }>
  createdAt: Date
  updatedAt: Date
}

export interface Purchase {
  id: string
  buyerId: string
  agentId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  stripePaymentIntentId: string
  createdAt: Date
}

export interface A2ASession {
  id: string
  buyerId: string
  agentIds: string[]
  workflow: any // Workflow definition
  status: "running" | "paused" | "completed" | "failed"
  messages: A2AMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface A2AMessage {
  id: string
  sessionId: string
  fromAgentId: string
  toAgentId: string
  type: "request" | "response" | "event" | "status"
  payload: any
  timestamp: Date
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Transaction {
  id: string
  userId: string
  type: "purchase" | "usage" | "payout" | "earning"
  amount: number // credits or currency amount in cents
  currency: string // 'credits' or 'usd'
  description: string
  createdAt: Date
  relatedId?: string // e.g., agentId for usage, purchaseId for purchase
}

export interface Pricing {
  amount: number
  currency: "credits"
  type: "one-time"
}

export interface Rating {
  average: number
  count: number
}
