-- Migration script to create Supabase database schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MCP Tools table
CREATE TABLE IF NOT EXISTS mcp_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  api_endpoint TEXT,
  auth_type TEXT CHECK (auth_type IN ('api_key', 'oauth', 'bearer', 'basic')) DEFAULT 'api_key',
  required_scopes TEXT,
  documentation_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  price_per_use_credits INTEGER NOT NULL,
  price_subscription_credits INTEGER,
  price_one_time_credits INTEGER,
  status TEXT DEFAULT 'active',
  category TEXT,
  tags TEXT,
  demo_url TEXT,
  documentation TEXT,
  requires_tools BOOLEAN DEFAULT false,
  tool_credits_per_use INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Tools table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS agent_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
  required_permissions TEXT,
  usage_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, tool_id)
);

-- User Credentials table (encrypted storage)
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
  credential_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  credential_type TEXT CHECK (credential_type IN ('api_key', 'oauth_token', 'oauth_refresh_token', 'username_password')) DEFAULT 'api_key',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tool_id, credential_name)
);

-- Tool Usage Logs table
CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  tool_id UUID REFERENCES mcp_tools(id),
  usage_type TEXT CHECK (usage_type IN ('api_call', 'authentication', 'error')) DEFAULT 'api_call',
  request_data TEXT,
  response_status INTEGER,
  response_data TEXT,
  credits_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  tool_id UUID REFERENCES mcp_tools(id),
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'use', 'commission', 'payout', 'promo', 'tool_usage')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  purchase_type TEXT CHECK (purchase_type IN ('per_use', 'subscription', 'one_time')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id ON agent_tools(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tools_tool_id ON agent_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_tool_id ON user_credentials(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_user_id ON tool_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_agent_id ON tool_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_from_user_id ON credit_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_to_user_id ON credit_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_agent_id ON credit_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_agent_id ON purchases(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- Insert sample data (optional - remove if you don't want sample data)
-- Uncomment the following section if you want to insert sample data

/*
-- Insert admin user
INSERT INTO users (id, email, name, role, password) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@agentverse.com', 'Admin User', 'admin', 'password')
ON CONFLICT (email) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, email, name, role, password) VALUES 
  ('00000000-0000-0000-0000-000000000002', 'user1@agentverse.com', 'Sample User 1', 'user', 'password'),
  ('00000000-0000-0000-0000-000000000003', 'user2@agentverse.com', 'Sample User 2', 'user', 'password')
ON CONFLICT (email) DO NOTHING;

-- Insert wallets
INSERT INTO wallets (user_id, balance) VALUES 
  ('00000000-0000-0000-0000-000000000001', 100000),
  ('00000000-0000-0000-0000-000000000002', 5000),
  ('00000000-0000-0000-0000-000000000003', 1000)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample MCP tools
INSERT INTO mcp_tools (id, name, description, category, api_endpoint, auth_type, required_scopes, documentation_url) VALUES 
  ('00000000-0000-0000-0000-000000000010', 'Google Sheets API', 'Read and write data to Google Sheets', 'Productivity', 'https://sheets.googleapis.com/v4', 'oauth', 'https://www.googleapis.com/auth/spreadsheets', 'https://developers.google.com/sheets/api'),
  ('00000000-0000-0000-0000-000000000011', 'Slack Messaging API', 'Send messages and interact with Slack workspaces', 'Communication', 'https://slack.com/api', 'bearer', 'chat:write,channels:read', 'https://api.slack.com/'),
  ('00000000-0000-0000-0000-000000000012', 'Email Sender API', 'Send emails through various providers', 'Communication', 'https://api.emailservice.com/v1', 'api_key', 'send:email', 'https://docs.emailservice.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample agents
INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_one_time_credits, category, tags, requires_tools, tool_credits_per_use) VALUES 
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Smart Spreadsheet Assistant', 'AI agent that reads, analyzes, and updates Google Sheets automatically. Can generate reports, clean data, and perform calculations.', 15, 150, 'Productivity', 'spreadsheets,google-sheets,data-analysis', true, 2),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Team Communication Bot', 'AI agent that helps manage team communications across Slack and email. Can schedule messages, analyze sentiment, and generate summaries.', 30, 600, 'Communication', 'slack,email,team-management', true, 3),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Data Analyzer AI', 'Powerful AI agent for analyzing datasets and generating insights. Works without external tools.', 50, 800, 'Data Science', 'data-analysis,insights,visualization', false, 0)
ON CONFLICT (id) DO NOTHING;

-- Link agents to tools
INSERT INTO agent_tools (agent_id, tool_id, required_permissions, usage_description) VALUES 
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'read,write,create', 'Reads spreadsheet data, performs analysis, and writes results back to sheets'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', 'send_messages,read_channels', 'Sends automated messages and reads channel history for context'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'send_email', 'Sends follow-up emails and notifications to team members')
ON CONFLICT (agent_id, tool_id) DO NOTHING;
*/