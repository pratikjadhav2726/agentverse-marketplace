// Database schema definitions for the AI Agent marketplace

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
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
  requires_tools: boolean;
  tool_credits_per_use: number;
}

export interface MCPTool {
  id: string;
  name: string;
  description?: string;
  category?: string;
  api_endpoint?: string;
  auth_type: 'api_key' | 'oauth' | 'bearer' | 'basic';
  required_scopes?: string;
  documentation_url?: string;
  is_public: boolean;
  created_at: string;
}

export interface AgentTool {
  id: string;
  agent_id: string;
  tool_id: string;
  required_permissions?: string;
  usage_description?: string;
  created_at: string;
}

export interface UserCredential {
  id: string;
  user_id: string;
  tool_id: string;
  credential_name: string;
  encrypted_value: string;
  credential_type: 'api_key' | 'oauth_token' | 'oauth_refresh_token' | 'username_password';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolUsageLog {
  id: string;
  user_id?: string;
  agent_id?: string;
  tool_id?: string;
  usage_type: 'api_call' | 'authentication' | 'error';
  request_data?: string;
  response_status?: number;
  response_data?: string;
  credits_consumed: number;
  created_at: string;
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
  tool_id?: string;
  amount: number;
  type: 'purchase' | 'use' | 'commission' | 'payout' | 'promo' | 'tool_usage';
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

// Extended interfaces for API responses
export interface AgentWithTools extends Agent {
  tools?: MCPTool[];
  tool_count?: number;
  owner?: {
    name: string;
    email: string;
  };
}

export interface MCPToolWithUsage extends MCPTool {
  agent_count?: number;
  recent_usage?: number;
}