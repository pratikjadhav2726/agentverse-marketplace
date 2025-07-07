import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Create database instance
const sqlite = new Database('agentverse.db');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database with schema
export function initializeDatabase() {
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT CHECK (role IN ('admin', 'seller', 'buyer')) NOT NULL DEFAULT 'buyer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agents table
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
        documentation TEXT
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
        amount INTEGER NOT NULL,
        type TEXT CHECK (type IN ('purchase', 'use', 'commission', 'payout', 'promo')),
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
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

function seedDatabase() {
  try {
    // Check if admin user already exists
    const adminExists = sqlite.prepare('SELECT id FROM users WHERE email = ?').get('admin@agentverse.com');
    
    if (!adminExists) {
      // Insert admin user
      const adminId = 'admin-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)').run(
        adminId,
        'admin@agentverse.com',
        'Admin User',
        'admin'
      );

      // Insert admin wallet
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(
        adminId,
        100000
      );

      // Insert sample seller
      const sellerId = 'seller-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)').run(
        sellerId,
        'seller@agentverse.com',
        'Sample Seller',
        'seller'
      );

      // Insert seller wallet
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(
        sellerId,
        5000
      );

      // Insert sample buyer
      const buyerId = 'buyer-id-12345678';
      sqlite.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)').run(
        buyerId,
        'buyer@agentverse.com',
        'Sample Buyer',
        'buyer'
      );

      // Insert buyer wallet
      sqlite.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(
        buyerId,
        1000
      );

      // Insert sample agents
      const agent1Id = 'agent-1-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_one_time_credits, category, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent1Id,
        sellerId,
        'Text Summarizer AI',
        'Advanced AI agent that can summarize long texts into concise, meaningful summaries.',
        10,
        100,
        'Text Processing',
        'summarization,nlp,text'
      );

      const agent2Id = 'agent-2-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_subscription_credits, category, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent2Id,
        sellerId,
        'Code Generator AI',
        'AI agent that generates high-quality code based on natural language descriptions.',
        25,
        500,
        'Development',
        'code-generation,programming,ai'
      );

      const agent3Id = 'agent-3-12345678';
      sqlite.prepare(`
        INSERT INTO agents (id, owner_id, name, description, price_per_use_credits, price_one_time_credits, category, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agent3Id,
        sellerId,
        'Data Analyzer AI',
        'Powerful AI agent for analyzing datasets and generating insights.',
        50,
        800,
        'Data Science',
        'data-analysis,insights,visualization'
      );

      console.log('Sample data seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export database instance
export { sqlite };