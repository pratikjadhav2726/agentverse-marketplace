export type User = {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "user";
};

export type Agent = {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  price_per_use_credits: number;
  price_subscription_credits?: number;
  price_one_time_credits?: number;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
};

export type CreditTransaction = {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  agent_id?: string;
  amount: number;
  type: 'purchase' | 'use' | 'commission' | 'payout' | 'promo';
  metadata?: any;
  created_at: string;
};

export type PayoutRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  processed_at?: string;
};

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
