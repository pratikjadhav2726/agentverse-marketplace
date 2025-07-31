// Database schema definitions for the AI Agent marketplace with A2A and MCP support

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  created_at: string;
}

// Extended Agent interface with A2A Agent Card support
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
  // A2A Agent Card fields
  version?: string;
  service_endpoint_url?: string;
  supported_modalities?: string; // JSON array: ["text", "audio", "video", "image"]
  capabilities?: string; // JSON array of capability descriptions
  skills?: string; // JSON array of specific skills
  authentication_requirements?: string; // JSON object with auth details
  input_schema?: string; // JSON schema for inputs
  output_schema?: string; // JSON schema for outputs
  collaboration_enabled: boolean;
  max_concurrent_tasks?: number;
  average_response_time?: number; // in milliseconds
}

// A2A Agent Card - standardized JSON representation
export interface AgentCard {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  service_endpoint_url: string;
  supported_modalities: string[]; // ["text", "audio", "video", "image"]
  capabilities: string[];
  skills: string[];
  authentication_requirements: {
    type: 'api_key' | 'oauth' | 'jwt' | 'none';
    scopes?: string[];
    required_headers?: string[];
  };
  input_schema: object;
  output_schema: object;
  pricing: {
    per_use_credits: number;
    subscription_credits?: number;
    one_time_credits?: number;
    tool_credits_per_use: number;
  };
  metadata: {
    category: string;
    tags: string[];
    owner_id: string;
    created_at: string;
    updated_at: string;
  };
}

// A2A Tasks for agent collaboration
export interface A2ATask {
  id: string;
  client_agent_id?: string; // Agent that initiated the task
  server_agent_id: string; // Agent that will execute the task
  user_id: string;
  title: string;
  description: string;
  status: 'submitted' | 'working' | 'input_required' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  input_data?: string; // JSON
  output_data?: string; // JSON
  error_message?: string;
  estimated_credits: number;
  actual_credits_consumed?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
}

// A2A Messages for task communication
export interface A2AMessage {
  id: string;
  task_id: string;
  sender_type: 'user' | 'agent';
  sender_id: string;
  content: string; // JSON with parts
  message_type: 'instruction' | 'response' | 'status_update' | 'error' | 'clarification';
  created_at: string;
}

// A2A Artifacts - tangible outputs
export interface A2AArtifact {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  content_type: 'text/plain' | 'application/json' | 'image/png' | 'application/pdf' | 'text/html';
  content: string; // Base64 encoded for binary data
  file_size?: number;
  created_at: string;
}

// Agent Companies for collaboration
export interface AgentCompany {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  company_type: 'individual' | 'team' | 'enterprise';
  max_agents: number;
  shared_credit_pool: number;
  created_at: string;
  updated_at: string;
}

// Company members and roles
export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string; // JSON array of permissions
  joined_at: string;
}

// Company agents
export interface CompanyAgent {
  id: string;
  company_id: string;
  agent_id: string;
  role: 'manager' | 'specialist' | 'worker';
  access_level: 'full' | 'limited' | 'read_only';
  can_delegate_tasks: boolean;
  added_at: string;
}

// Shared resources within companies
export interface SharedResource {
  id: string;
  company_id: string;
  name: string;
  type: 'knowledge_base' | 'tool_configuration' | 'workflow_template' | 'credential_set';
  content: string; // JSON
  access_level: 'company' | 'team' | 'private';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Workflows for multi-agent orchestration
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  company_id?: string;
  workflow_definition: string; // JSON with nodes and connections
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: string;
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Workflow executions
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data?: string; // JSON
  output_data?: string; // JSON
  error_message?: string;
  total_credits_consumed: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Workflow execution steps
export interface WorkflowExecutionStep {
  id: string;
  execution_id: string;
  step_name: string;
  agent_id?: string;
  task_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data?: string; // JSON
  output_data?: string; // JSON
  error_message?: string;
  credits_consumed: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Enhanced MCP Tools with context management
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
  // Enhanced MCP fields
  context_schema?: string; // JSON schema for context requirements
  supports_streaming: boolean;
  supports_batching: boolean;
  rate_limit_per_minute?: number;
  cost_per_invocation: number;
  reliability_score?: number; // 0-100
  average_response_time?: number; // in milliseconds
}

// MCP Context sessions
export interface MCPContextSession {
  id: string;
  user_id: string;
  agent_id?: string;
  tool_id: string;
  session_data: string; // JSON with context state
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Enhanced existing interfaces
export interface AgentTool {
  id: string;
  agent_id: string;
  tool_id: string;
  required_permissions?: string;
  usage_description?: string;
  created_at: string;
  // Enhanced fields
  context_requirements?: string; // JSON
  delegation_allowed: boolean;
  cost_sharing_enabled: boolean;
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
  // Enhanced fields
  company_id?: string; // For shared credentials
  access_level: 'personal' | 'shared' | 'company';
  auto_rotate: boolean;
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
  // Enhanced fields
  task_id?: string;
  workflow_execution_id?: string;
  context_session_id?: string;
  response_time_ms?: number;
  success: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
  // Enhanced fields
  company_id?: string; // For shared company wallets
  wallet_type: 'personal' | 'company' | 'escrow';
  credit_limit?: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold?: number;
  auto_recharge_amount?: number;
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
  // Enhanced fields
  task_id?: string;
  workflow_execution_id?: string;
  company_id?: string;
  transaction_category: 'agent_usage' | 'tool_usage' | 'collaboration' | 'system' | 'refund';
  exchange_rate?: number; // For future multi-currency support
}

export interface Purchase {
  id: string;
  user_id: string;
  agent_id: string;
  purchase_type: 'per_use' | 'subscription' | 'one_time';
  created_at: string;
  // Enhanced fields
  company_id?: string;
  collaboration_enabled: boolean;
  max_concurrent_usage?: number;
  expires_at?: string;
}

export interface Review {
  id: string;
  user_id: string;
  agent_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  // Enhanced fields
  collaboration_rating?: number; // Separate rating for collaboration features
  performance_rating?: number; // Rating for performance/speed
  reliability_rating?: number; // Rating for reliability
  verified_purchase: boolean;
  helpful_votes: number;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  processed_at?: string;
  // Enhanced fields
  company_id?: string;
  payout_method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
  processing_fee: number;
  net_amount: number;
}

// Extended interfaces for API responses
export interface AgentWithTools extends Agent {
  tools?: MCPTool[];
  tool_count?: number;
  owner?: {
    name: string;
    email: string;
  };
  // Enhanced fields
  agent_card?: AgentCard;
  collaboration_stats?: {
    total_tasks_completed: number;
    average_task_duration: number;
    success_rate: number;
    collaboration_rating: number;
  };
  active_tasks?: number;
  company?: AgentCompany;
}

export interface MCPToolWithUsage extends MCPTool {
  agent_count?: number;
  recent_usage?: number;
  // Enhanced fields
  context_sessions_active?: number;
  performance_metrics?: {
    average_response_time: number;
    success_rate: number;
    uptime_percentage: number;
  };
}

// New composite interfaces for complex operations
export interface CollaborativeWorkflowRequest {
  name: string;
  description: string;
  agents: string[]; // Agent IDs
  tasks: {
    id: string;
    agent_id: string;
    dependencies: string[];
    input_mapping: object;
    output_mapping: object;
  }[];
  estimated_total_credits: number;
}

export interface AgentDiscoveryQuery {
  capabilities?: string[];
  skills?: string[];
  categories?: string[];
  max_price_per_use?: number;
  collaboration_enabled?: boolean;
  supported_modalities?: string[];
  min_reliability_score?: number;
  max_response_time?: number;
}