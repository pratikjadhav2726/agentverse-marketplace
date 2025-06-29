export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "seller" | "buyer"
  credits: number
  createdAt: string
  updatedAt: string
  stripeCustomerId?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  readme: string
  documentation: string
  avatar: string
  creator: string
  sellerId: string
  capabilities: string[]
  status: "pending" | "active" | "rejected"
  a2aEndpoint: string
  dockerImage?: string
  metadata: Record<string, any>
  pricing: Pricing
  ratings: {
    average: number
    count: number
  }
  reviews: Review[]
  examples: Example[]
  createdAt: string
  updatedAt: string
}

export interface Purchase {
  id: string
  userId: string
  agentId: string
  createdAt: string
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
  id: string
  agentId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: "purchase" | "usage"
  agentId?: string // only for usage
  amount: number // in credits
  description: string
  createdAt: string
}

export interface ApiUsage {
  userId: string
  endpoint: string
  timestamps: number[]
}

export interface Pricing {
  amount: number
  currency: "credits"
}

export interface Example {
  input: Record<string, any>
  output: Record<string, any>
  description?: string
}

export interface Rating {
  average: number
  count: number
}
