// Database schema definitions for the AI Agent marketplace

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'seller' | 'buyer';
  created_at: string;
}

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  price_per_use_credits: number;
  price_subscription_credits?: number;
  price_one_time_credits?: number;
  status: string;
  created_at: string;
  category?: string;
  tags?: string;
  demo_url?: string;
  documentation?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  agent_id?: string;
  amount: number;
  type: 'purchase' | 'use' | 'commission' | 'payout' | 'promo';
  metadata?: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  agent_id: string;
  purchase_type: 'per_use' | 'subscription' | 'one_time';
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  agent_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  processed_at?: string;
}