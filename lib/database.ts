import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import * as crypto from 'crypto';

// Create database instance
const sqlite = new Database('agentverse.db');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Encryption key for credentials (in production, this should be from environment)
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || 'your-32-char-secret-key-here!!';

// Simple encryption/decryption functions
export function encryptCredential(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptCredential(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Initialize database with schema
export function initializeDatabase() {
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        password TEXT
      )
    `);

    // Create MCP tools table (enhanced)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS mcp_tools (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        api_endpoint TEXT,
        auth_type TEXT CHECK (auth_type IN ('api_key', 'oauth', 'bearer', 'basic')) DEFAULT 'api_key',
        required_scopes TEXT,
        documentation_url TEXT,
        is_public BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        context_schema TEXT,
        supports_streaming BOOLEAN DEFAULT false,
        supports_batching BOOLEAN DEFAULT false,
        rate_limit_per_minute INTEGER,
        cost_per_invocation INTEGER DEFAULT 1,
        reliability_score INTEGER DEFAULT 100,
        average_response_time INTEGER
      )
    `);

    // Create agent_tools table (many-to-many relationship, enhanced)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agent_tools (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
        tool_id TEXT REFERENCES mcp_tools(id) ON DELETE CASCADE,
        required_permissions TEXT,
        usage_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        context_requirements TEXT,
        delegation_allowed BOOLEAN DEFAULT false,
        cost_sharing_enabled BOOLEAN DEFAULT false,
        UNIQUE(agent_id, tool_id)
      )
    `);

    // Create user_credentials table (encrypted storage, enhanced)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        tool_id TEXT REFERENCES mcp_tools(id) ON DELETE CASCADE,
        credential_name TEXT NOT NULL,
        encrypted_value TEXT NOT NULL,
        credential_type TEXT CHECK (credential_type IN ('api_key', 'oauth_token', 'oauth_refresh_token', 'username_password')) DEFAULT 'api_key',
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        company_id TEXT,
        access_level TEXT CHECK (access_level IN ('personal', 'shared', 'company')) DEFAULT 'personal',
        auto_rotate BOOLEAN DEFAULT false,
        UNIQUE(user_id, tool_id, credential_name)
      )
    `);

    // Create tool_usage_logs table (enhanced)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tool_usage_logs (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id),
        agent_id TEXT REFERENCES agents(id),
        tool_id TEXT REFERENCES mcp_tools(id),
        usage_type TEXT CHECK (usage_type IN ('api_call', 'authentication', 'error')) DEFAULT 'api_call',
        request_data TEXT,
        response_status INTEGER,
        response_data TEXT,
        credits_consumed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        task_id TEXT,
        workflow_execution_id TEXT,
        context_session_id TEXT,
        response_time_ms INTEGER,
        success BOOLEAN DEFAULT true
      )
    `);

    // Create agents table (enhanced with A2A support)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        owner_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        price_per_use_credits INTEGER NOT NULL,
        price_subscription_credits INTEGER,
        price_one_time_credits INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        category TEXT,
        tags TEXT,
        demo_url TEXT,
        documentation TEXT,
        requires_tools BOOLEAN DEFAULT false,
        tool_credits_per_use INTEGER DEFAULT 1,
        version TEXT DEFAULT '1.0.0',
        service_endpoint_url TEXT,
        supported_modalities TEXT DEFAULT '["text"]',
        capabilities TEXT DEFAULT '[]',
        skills TEXT DEFAULT '[]',
        authentication_requirements TEXT DEFAULT '{"type": "none"}',
        input_schema TEXT,
        output_schema TEXT,
        collaboration_enabled BOOLEAN DEFAULT false,
        max_concurrent_tasks INTEGER DEFAULT 1,
        average_response_time INTEGER DEFAULT 5000
      )
    `);

    // Create wallets table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT UNIQUE REFERENCES users(id),
        balance INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create credit_transactions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        agent_id TEXT REFERENCES agents(id),
        tool_id TEXT REFERENCES mcp_tools(id),
        amount INTEGER NOT NULL,
        type TEXT CHECK (type IN ('purchase', 'use', 'commission', 'payout', 'promo', 'tool_usage')),
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create purchases table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id),
        agent_id TEXT REFERENCES agents(id),
        purchase_type TEXT CHECK (purchase_type IN ('per_use', 'subscription', 'one_time')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reviews table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id),
        agent_id TEXT REFERENCES agents(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payout_requests table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id),
        amount INTEGER NOT NULL,
        status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'paid')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      )
    `);

    // Create A2A Tasks table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS a2a_tasks (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        client_agent_id TEXT REFERENCES agents(id),
        server_agent_id TEXT REFERENCES agents(id) NOT NULL,
        user_id TEXT REFERENCES users(id) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK (status IN ('submitted', 'working', 'input_required', 'completed', 'failed', 'cancelled')) DEFAULT 'submitted',
        priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        estimated_credits INTEGER DEFAULT 0,
        actual_credits_consumed INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        expires_at DATETIME
      )
    `);

    // Create A2A Messages table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS a2a_messages (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        task_id TEXT REFERENCES a2a_tasks(id) ON DELETE CASCADE,
        sender_type TEXT CHECK (sender_type IN ('user', 'agent')) NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT CHECK (message_type IN ('instruction', 'response', 'status_update', 'error', 'clarification')) DEFAULT 'response',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create A2A Artifacts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS a2a_artifacts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        task_id TEXT REFERENCES a2a_tasks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        content_type TEXT DEFAULT 'text/plain',
        content TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Agent Companies table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agent_companies (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT REFERENCES users(id) NOT NULL,
        company_type TEXT CHECK (company_type IN ('individual', 'team', 'enterprise')) DEFAULT 'individual',
        max_agents INTEGER DEFAULT 10,
        shared_credit_pool INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Company Members table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS company_members (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        company_id TEXT REFERENCES agent_companies(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
        permissions TEXT DEFAULT '[]',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, user_id)
      )
    `);

    // Create Company Agents table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS company_agents (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        company_id TEXT REFERENCES agent_companies(id) ON DELETE CASCADE,
        agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
        role TEXT CHECK (role IN ('manager', 'specialist', 'worker')) DEFAULT 'worker',
        access_level TEXT CHECK (access_level IN ('full', 'limited', 'read_only')) DEFAULT 'limited',
        can_delegate_tasks BOOLEAN DEFAULT false,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, agent_id)
      )
    `);

    // Create Shared Resources table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS shared_resources (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        company_id TEXT REFERENCES agent_companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT CHECK (type IN ('knowledge_base', 'tool_configuration', 'workflow_template', 'credential_set')) NOT NULL,
        content TEXT NOT NULL,
        access_level TEXT CHECK (access_level IN ('company', 'team', 'private')) DEFAULT 'company',
        created_by TEXT REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Workflows table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT REFERENCES users(id) NOT NULL,
        company_id TEXT REFERENCES agent_companies(id),
        workflow_definition TEXT NOT NULL,
        status TEXT CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'draft',
        version TEXT DEFAULT '1.0.0',
        is_template BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Workflow Executions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        workflow_id TEXT REFERENCES workflows(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) NOT NULL,
        status TEXT CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        total_credits_consumed INTEGER DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Workflow Execution Steps table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow_execution_steps (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        execution_id TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
        step_name TEXT NOT NULL,
        agent_id TEXT REFERENCES agents(id),
        task_id TEXT REFERENCES a2a_tasks(id),
        status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        credits_consumed INTEGER DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MCP Context Sessions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS mcp_context_sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) NOT NULL,
        agent_id TEXT REFERENCES agents(id),
        tool_id TEXT REFERENCES mcp_tools(id) NOT NULL,
        session_data TEXT NOT NULL DEFAULT '{}',
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update existing tables with enhanced fields (safely)
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN company_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN wallet_type TEXT CHECK (wallet_type IN ('personal', 'company', 'escrow')) DEFAULT 'personal'`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN credit_limit INTEGER`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN auto_recharge_enabled BOOLEAN DEFAULT false`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN auto_recharge_threshold INTEGER`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE wallets ADD COLUMN auto_recharge_amount INTEGER`);
    } catch (e) { /* Column might already exist */ }

    try {
      sqlite.exec(`ALTER TABLE credit_transactions ADD COLUMN task_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE credit_transactions ADD COLUMN workflow_execution_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE credit_transactions ADD COLUMN company_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE credit_transactions ADD COLUMN transaction_category TEXT CHECK (transaction_category IN ('agent_usage', 'tool_usage', 'collaboration', 'system', 'refund')) DEFAULT 'agent_usage'`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE credit_transactions ADD COLUMN exchange_rate REAL DEFAULT 1.0`);
    } catch (e) { /* Column might already exist */ }

    try {
      sqlite.exec(`ALTER TABLE purchases ADD COLUMN company_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE purchases ADD COLUMN collaboration_enabled BOOLEAN DEFAULT false`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE purchases ADD COLUMN max_concurrent_usage INTEGER`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE purchases ADD COLUMN expires_at DATETIME`);
    } catch (e) { /* Column might already exist */ }

    try {
      sqlite.exec(`ALTER TABLE reviews ADD COLUMN collaboration_rating INTEGER CHECK (collaboration_rating >= 1 AND collaboration_rating <= 5)`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE reviews ADD COLUMN performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5)`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE reviews ADD COLUMN reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5)`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE reviews ADD COLUMN verified_purchase BOOLEAN DEFAULT false`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE reviews ADD COLUMN helpful_votes INTEGER DEFAULT 0`);
    } catch (e) { /* Column might already exist */ }

    try {
      sqlite.exec(`ALTER TABLE payout_requests ADD COLUMN company_id TEXT`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE payout_requests ADD COLUMN payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe', 'crypto')) DEFAULT 'stripe'`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE payout_requests ADD COLUMN processing_fee INTEGER DEFAULT 0`);
    } catch (e) { /* Column might already exist */ }
    try {
      sqlite.exec(`ALTER TABLE payout_requests ADD COLUMN net_amount INTEGER DEFAULT 0`);
    } catch (e) { /* Column might already exist */ }

    // Insert seed data
    seedDatabase();
    
    console.log('Database initialized successfully with MCP tools support');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

function seedDatabase() {
  try {
    // Check if admin user already exists
    const adminExists = sqlite.prepare('SELECT id FROM users WHERE email = ?').get('admin@agentverse.com');
    
    if (!adminExists) {
      // Insert users
      const adminId = 'admin-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)').run(
        adminId, 'admin@agentverse.com', 'Admin User', 'admin', 'password'
      );

      const user1Id = 'user1-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)').run(
        user1Id, 'user1@agentverse.com', 'Sample User 1', 'user', 'password'
      );

      const user2Id = 'user2-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)').run(
        user2Id, 'user2@agentverse.com', 'Sample User 2', 'user', 'password'
      );

      // Insert wallets
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(adminId, 100000);
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(user1Id, 5000);
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(user2Id, 1000);

      // Insert sample MCP tools
      const tool1Id = 'tool-google-sheets';
      sqlite.prepare(`
        INSERT INTO mcp_tools (id, name, description, category, api_endpoint, auth_type, required_scopes, documentation_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tool1Id,
        'Google Sheets API',
        'Read and write data to Google Sheets',
        'Productivity',
        'https://sheets.googleapis.com/v4',
        'oauth',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://developers.google.com/sheets/api'
      );

      const tool2Id = 'tool-slack-messaging';
      sqlite.prepare(`
        INSERT INTO mcp_tools (id, name, description, category, api_endpoint, auth_type, required_scopes, documentation_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tool2Id,
        'Slack Messaging API',
        'Send messages and interact with Slack workspaces',
        'Communication',
        'https://slack.com/api',
        'bearer',
        'chat:write,channels:read',
        'https://api.slack.com/'
      );

      const tool3Id = 'tool-email-sender';
      sqlite.prepare(`
        INSERT INTO mcp_tools (id, name, description, category, api_endpoint, auth_type, required_scopes, documentation_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tool3Id,
        'Email Sender API',
        'Send emails through various providers',
        'Communication',
        'https://api.emailservice.com/v1',
        'api_key',
        'send:email',
        'https://docs.emailservice.com'
      );

      // Insert sample agents with enhanced A2A capabilities
      const agent1Id = 'agent-1-12345678';
      sqlite.prepare(`
        INSERT INTO agents (
          id, owner_id, name, description, price_per_use_credits, price_one_time_credits, 
          category, tags, requires_tools, tool_credits_per_use, version, 
          service_endpoint_url, supported_modalities, capabilities, skills, 
          authentication_requirements, collaboration_enabled, max_concurrent_tasks, average_response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent1Id, adminId,
        'Smart Spreadsheet Assistant',
        'AI agent that reads, analyzes, and updates Google Sheets automatically. Can generate reports, clean data, and perform calculations. Supports collaboration with other agents.',
        15, 150, 'Productivity', 'spreadsheets,google-sheets,data-analysis,collaboration', 1, 2, '1.2.0',
        'https://api.agentverse.com/agents/spreadsheet-assistant',
        '["text", "image"]',
        '["data_analysis", "spreadsheet_manipulation", "report_generation", "task_delegation"]',
        '["google_sheets_api", "data_visualization", "statistical_analysis", "collaborative_editing"]',
        '{"type": "api_key", "required_headers": ["X-API-Key"]}',
        1, 3, 2500
      );

      const agent2Id = 'agent-2-12345678';
      sqlite.prepare(`
        INSERT INTO agents (
          id, owner_id, name, description, price_per_use_credits, price_subscription_credits, 
          category, tags, requires_tools, tool_credits_per_use, version, 
          service_endpoint_url, supported_modalities, capabilities, skills, 
          authentication_requirements, collaboration_enabled, max_concurrent_tasks, average_response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent2Id, adminId,
        'Team Communication Bot',
        'AI agent that helps manage team communications across Slack and email. Can schedule messages, analyze sentiment, and generate summaries. Excellent for multi-agent workflows.',
        30, 600, 'Communication', 'slack,email,team-management,orchestration', 1, 3, '2.1.0',
        'https://api.agentverse.com/agents/communication-bot',
        '["text", "audio"]',
        '["message_scheduling", "sentiment_analysis", "team_coordination", "workflow_orchestration"]',
        '["slack_integration", "email_automation", "natural_language_processing", "task_routing"]',
        '{"type": "oauth", "scopes": ["chat:write", "channels:read"]}',
        1, 5, 1800
      );

      const agent3Id = 'agent-3-12345678';
      sqlite.prepare(`
        INSERT INTO agents (
          id, owner_id, name, description, price_per_use_credits, price_one_time_credits, 
          category, tags, requires_tools, tool_credits_per_use, version, 
          service_endpoint_url, supported_modalities, capabilities, skills, 
          authentication_requirements, collaboration_enabled, max_concurrent_tasks, average_response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent3Id, adminId,
        'Data Analyzer AI',
        'Powerful AI agent for analyzing datasets and generating insights. Works without external tools but can collaborate with other agents to provide comprehensive analysis.',
        50, 800, 'Data Science', 'data-analysis,insights,visualization,collaboration', 0, 0, '3.0.1',
        'https://api.agentverse.com/agents/data-analyzer',
        '["text", "image", "video"]',
        '["statistical_analysis", "data_visualization", "pattern_recognition", "collaborative_insights"]',
        '["machine_learning", "data_mining", "predictive_modeling", "report_generation"]',
        '{"type": "jwt", "required_headers": ["Authorization"]}',
        1, 2, 3200
      );

      // Insert a collaborative workflow agent
      const agent4Id = 'agent-4-12345678';
      sqlite.prepare(`
        INSERT INTO agents (
          id, owner_id, name, description, price_per_use_credits, price_subscription_credits, 
          category, tags, requires_tools, tool_credits_per_use, version, 
          service_endpoint_url, supported_modalities, capabilities, skills, 
          authentication_requirements, collaboration_enabled, max_concurrent_tasks, average_response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent4Id, adminId,
        'Workflow Orchestrator',
        'Master agent that coordinates complex multi-agent workflows. Can delegate tasks, manage dependencies, and ensure smooth collaboration between specialized agents.',
        25, 400, 'Orchestration', 'workflow,orchestration,management,a2a', 0, 1, '1.0.0',
        'https://api.agentverse.com/agents/workflow-orchestrator',
        '["text"]',
        '["task_delegation", "workflow_management", "agent_coordination", "dependency_resolution"]',
        '["a2a_protocol", "task_scheduling", "resource_management", "error_handling"]',
        '{"type": "api_key", "required_headers": ["X-API-Key"]}',
        1, 10, 1500
      );

      // Link agents to tools they use
      sqlite.prepare('INSERT INTO agent_tools (agent_id, tool_id, required_permissions, usage_description) VALUES (?, ?, ?, ?)').run(
        agent1Id, tool1Id, 'read,write,create', 'Reads spreadsheet data, performs analysis, and writes results back to sheets'
      );

      sqlite.prepare('INSERT INTO agent_tools (agent_id, tool_id, required_permissions, usage_description) VALUES (?, ?, ?, ?)').run(
        agent2Id, tool2Id, 'send_messages,read_channels', 'Sends automated messages and reads channel history for context'
      );

      sqlite.prepare('INSERT INTO agent_tools (agent_id, tool_id, required_permissions, usage_description) VALUES (?, ?, ?, ?)').run(
        agent2Id, tool3Id, 'send_email', 'Sends follow-up emails and notifications to team members'
      );

      // Create sample agent companies
      const company1Id = 'company-1-12345678';
      sqlite.prepare(`
        INSERT INTO agent_companies (id, name, description, owner_id, company_type, max_agents, shared_credit_pool)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        company1Id,
        'DataFlow Solutions',
        'Collaborative AI company specializing in data processing and analysis workflows',
        adminId,
        'team',
        25,
        5000
      );

      // Add company members
      sqlite.prepare(`
        INSERT INTO company_members (company_id, user_id, role, permissions)
        VALUES (?, ?, ?, ?)
      `).run(
        company1Id, adminId, 'owner', '["manage_agents", "manage_members", "manage_billing", "execute_workflows"]'
      );

      sqlite.prepare(`
        INSERT INTO company_members (company_id, user_id, role, permissions)
        VALUES (?, ?, ?, ?)
      `).run(
        company1Id, user1Id, 'member', '["use_agents", "create_workflows"]'
      );

      // Add agents to company
      sqlite.prepare(`
        INSERT INTO company_agents (company_id, agent_id, role, access_level, can_delegate_tasks)
        VALUES (?, ?, ?, ?, ?)
      `).run(company1Id, agent1Id, 'specialist', 'full', true);

      sqlite.prepare(`
        INSERT INTO company_agents (company_id, agent_id, role, access_level, can_delegate_tasks)
        VALUES (?, ?, ?, ?, ?)
      `).run(company1Id, agent3Id, 'specialist', 'full', true);

      sqlite.prepare(`
        INSERT INTO company_agents (company_id, agent_id, role, access_level, can_delegate_tasks)
        VALUES (?, ?, ?, ?, ?)
      `).run(company1Id, agent4Id, 'manager', 'full', true);

      // Create a sample workflow
      const workflow1Id = 'workflow-1-12345678';
      sqlite.prepare(`
        INSERT INTO workflows (id, name, description, owner_id, company_id, workflow_definition, status, is_template, is_public)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        workflow1Id,
        'Data Analysis Pipeline',
        'Automated pipeline for processing spreadsheet data and generating insights',
        adminId,
        company1Id,
        JSON.stringify({
          nodes: [
            {
              id: 'start',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: { label: 'Data Input' }
            },
            {
              id: 'agent1',
              type: 'agent',
              position: { x: 300, y: 100 },
              data: { 
                label: 'Spreadsheet Assistant',
                agent_id: agent1Id,
                task: 'Process and clean input data'
              }
            },
            {
              id: 'agent3',
              type: 'agent',
              position: { x: 500, y: 100 },
              data: { 
                label: 'Data Analyzer',
                agent_id: agent3Id,
                task: 'Analyze processed data and generate insights'
              }
            },
            {
              id: 'end',
              type: 'output',
              position: { x: 700, y: 100 },
              data: { label: 'Final Report' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'agent1' },
            { id: 'e2', source: 'agent1', target: 'agent3' },
            { id: 'e3', source: 'agent3', target: 'end' }
          ]
        }),
        'active',
        true,
        true
      );

      // Create sample shared resources
      sqlite.prepare(`
        INSERT INTO shared_resources (company_id, name, type, content, access_level, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        company1Id,
        'Data Processing Guidelines',
        'knowledge_base',
        JSON.stringify({
          title: 'Data Processing Best Practices',
          content: 'Guidelines for handling sensitive data, cleaning procedures, and quality assurance steps.',
          version: '1.0',
          tags: ['data-processing', 'guidelines', 'quality-assurance']
        }),
        'company',
        adminId
      );

      // Create sample A2A task
      const task1Id = 'task-1-12345678';
      sqlite.prepare(`
        INSERT INTO a2a_tasks (id, client_agent_id, server_agent_id, user_id, title, description, status, priority, estimated_credits)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task1Id,
        agent4Id,
        agent1Id,
        adminId,
        'Process Q4 Sales Data',
        'Clean and analyze the Q4 sales spreadsheet, focusing on regional performance metrics',
        'completed',
        'high',
        35
      );

      // Create sample messages for the task
      sqlite.prepare(`
        INSERT INTO a2a_messages (task_id, sender_type, sender_id, content, message_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        task1Id,
        'agent',
        agent4Id,
        JSON.stringify({
          parts: [{
            type: 'text/plain',
            content: 'Please process the attached Q4 sales data. Focus on regional performance and identify any anomalies.'
          }]
        }),
        'instruction'
      );

      sqlite.prepare(`
        INSERT INTO a2a_messages (task_id, sender_type, sender_id, content, message_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        task1Id,
        'agent',
        agent1Id,
        JSON.stringify({
          parts: [{
            type: 'text/plain',
            content: 'Task completed successfully. I have cleaned the data and identified 3 regional anomalies. Full analysis report attached.'
          }]
        }),
        'response'
      );

      // Create sample artifact
      sqlite.prepare(`
        INSERT INTO a2a_artifacts (task_id, name, description, content_type, content)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        task1Id,
        'Q4_Sales_Analysis_Report.json',
        'Comprehensive analysis of Q4 sales data with regional breakdown and anomaly detection',
        'application/json',
        JSON.stringify({
          summary: 'Q4 sales analysis completed',
          total_records: 15420,
          anomalies_found: 3,
          regional_performance: {
            north: { sales: 2.4e6, growth: 12.5 },
            south: { sales: 1.8e6, growth: 8.2 },
            east: { sales: 2.1e6, growth: 15.1 },
            west: { sales: 1.9e6, growth: 6.8 }
          },
          recommendations: [
            'Investigate low growth in West region',
            'Replicate East region strategies',
            'Address data quality issues in anomalous records'
          ]
        })
      );

      console.log('Sample data seeded successfully with A2A collaboration features');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export database instance
export { sqlite };