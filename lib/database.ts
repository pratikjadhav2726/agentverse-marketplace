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

    // Create MCP tools table
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agent_tools table (many-to-many relationship)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agent_tools (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
        tool_id TEXT REFERENCES mcp_tools(id) ON DELETE CASCADE,
        required_permissions TEXT,
        usage_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_id, tool_id)
      )
    `);

    // Create user_credentials table (encrypted storage)
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
        UNIQUE(user_id, tool_id, credential_name)
      )
    `);

    // Create tool_usage_logs table
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agents table (updated with tool capabilities)
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
        tool_credits_per_use INTEGER DEFAULT 1
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

      // Insert sample agents with tool integration
      const agent1Id = 'agent-1-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_one_time_credits, category, tags, requires_tools, tool_credits_per_use)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent1Id, adminId,
        'Smart Spreadsheet Assistant',
        'AI agent that reads, analyzes, and updates Google Sheets automatically. Can generate reports, clean data, and perform calculations.',
        15, 150, 'Productivity', 'spreadsheets,google-sheets,data-analysis', 1, 2
      );

      const agent2Id = 'agent-2-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_subscription_credits, category, tags, requires_tools, tool_credits_per_use)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent2Id, adminId,
        'Team Communication Bot',
        'AI agent that helps manage team communications across Slack and email. Can schedule messages, analyze sentiment, and generate summaries.',
        30, 600, 'Communication', 'slack,email,team-management', 1, 3
      );

      const agent3Id = 'agent-3-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_one_time_credits, category, tags, requires_tools, tool_credits_per_use)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent3Id, adminId,
        'Data Analyzer AI',
        'Powerful AI agent for analyzing datasets and generating insights. Works without external tools.',
        50, 800, 'Data Science', 'data-analysis,insights,visualization', 0, 0
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

      console.log('Sample data seeded successfully with MCP tools');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export database instance
export { sqlite };