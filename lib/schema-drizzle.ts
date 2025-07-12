import { sql } from 'drizzle-orm';
import { 
  text, 
  integer, 
  boolean, 
  timestamp, 
  pgTable, 
  sqliteTable,
  uuid,
  json
} from 'drizzle-orm/pg-core';
import { sqliteTable as sqliteTableDef } from 'drizzle-orm/sqlite-core';

// Helper to create tables for both SQLite and PostgreSQL
const createTable = (name: string, columns: any) => {
  if (process.env.NODE_ENV === 'production') {
    return pgTable(name, columns);
  } else {
    return sqliteTableDef(name, columns);
  }
};

// Users table
export const users = createTable('users', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  password: text('password'),
  created_at: timestamp('created_at').defaultNow(),
});

// MCP Tools table
export const mcpTools = createTable('mcp_tools', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  api_endpoint: text('api_endpoint'),
  auth_type: text('auth_type', { enum: ['api_key', 'oauth', 'bearer', 'basic'] }).default('api_key'),
  required_scopes: text('required_scopes'),
  documentation_url: text('documentation_url'),
  is_public: boolean('is_public').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// Agents table
export const agents = createTable('agents', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  owner_id: process.env.NODE_ENV === 'production'
    ? uuid('owner_id').references(() => users.id)
    : text('owner_id').references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  price_per_use_credits: integer('price_per_use_credits').notNull(),
  price_subscription_credits: integer('price_subscription_credits'),
  price_one_time_credits: integer('price_one_time_credits'),
  status: text('status').default('active'),
  category: text('category'),
  tags: text('tags'),
  demo_url: text('demo_url'),
  documentation: text('documentation'),
  requires_tools: boolean('requires_tools').default(false),
  tool_credits_per_use: integer('tool_credits_per_use').default(1),
  created_at: timestamp('created_at').defaultNow(),
});

// Agent Tools table (many-to-many relationship)
export const agentTools = createTable('agent_tools', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  agent_id: process.env.NODE_ENV === 'production'
    ? uuid('agent_id').references(() => agents.id)
    : text('agent_id').references(() => agents.id),
  tool_id: process.env.NODE_ENV === 'production'
    ? uuid('tool_id').references(() => mcpTools.id)
    : text('tool_id').references(() => mcpTools.id),
  required_permissions: text('required_permissions'),
  usage_description: text('usage_description'),
  created_at: timestamp('created_at').defaultNow(),
});

// User Credentials table (encrypted storage)
export const userCredentials = createTable('user_credentials', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id)
    : text('user_id').references(() => users.id),
  tool_id: process.env.NODE_ENV === 'production'
    ? uuid('tool_id').references(() => mcpTools.id)
    : text('tool_id').references(() => mcpTools.id),
  credential_name: text('credential_name').notNull(),
  encrypted_value: text('encrypted_value').notNull(),
  credential_type: text('credential_type', { 
    enum: ['api_key', 'oauth_token', 'oauth_refresh_token', 'username_password'] 
  }).default('api_key'),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Tool Usage Logs table
export const toolUsageLogs = createTable('tool_usage_logs', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id)
    : text('user_id').references(() => users.id),
  agent_id: process.env.NODE_ENV === 'production'
    ? uuid('agent_id').references(() => agents.id)
    : text('agent_id').references(() => agents.id),
  tool_id: process.env.NODE_ENV === 'production'
    ? uuid('tool_id').references(() => mcpTools.id)
    : text('tool_id').references(() => mcpTools.id),
  usage_type: text('usage_type', { enum: ['api_call', 'authentication', 'error'] }).default('api_call'),
  request_data: text('request_data'),
  response_status: integer('response_status'),
  response_data: text('response_data'),
  credits_consumed: integer('credits_consumed').default(0),
  created_at: timestamp('created_at').defaultNow(),
});

// Wallets table
export const wallets = createTable('wallets', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id).unique()
    : text('user_id').references(() => users.id).unique(),
  balance: integer('balance').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Credit Transactions table
export const creditTransactions = createTable('credit_transactions', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  from_user_id: process.env.NODE_ENV === 'production'
    ? uuid('from_user_id').references(() => users.id)
    : text('from_user_id').references(() => users.id),
  to_user_id: process.env.NODE_ENV === 'production'
    ? uuid('to_user_id').references(() => users.id)
    : text('to_user_id').references(() => users.id),
  agent_id: process.env.NODE_ENV === 'production'
    ? uuid('agent_id').references(() => agents.id)
    : text('agent_id').references(() => agents.id),
  tool_id: process.env.NODE_ENV === 'production'
    ? uuid('tool_id').references(() => mcpTools.id)
    : text('tool_id').references(() => mcpTools.id),
  amount: integer('amount').notNull(),
  type: text('type', { 
    enum: ['purchase', 'use', 'commission', 'payout', 'promo', 'tool_usage'] 
  }),
  metadata: process.env.NODE_ENV === 'production' ? json('metadata') : text('metadata'),
  created_at: timestamp('created_at').defaultNow(),
});

// Purchases table
export const purchases = createTable('purchases', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id)
    : text('user_id').references(() => users.id),
  agent_id: process.env.NODE_ENV === 'production'
    ? uuid('agent_id').references(() => agents.id)
    : text('agent_id').references(() => agents.id),
  purchase_type: text('purchase_type', { 
    enum: ['per_use', 'subscription', 'one_time'] 
  }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Reviews table
export const reviews = createTable('reviews', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id)
    : text('user_id').references(() => users.id),
  agent_id: process.env.NODE_ENV === 'production'
    ? uuid('agent_id').references(() => agents.id)
    : text('agent_id').references(() => agents.id),
  rating: integer('rating'),
  comment: text('comment'),
  created_at: timestamp('created_at').defaultNow(),
});

// Payout Requests table
export const payoutRequests = createTable('payout_requests', {
  id: process.env.NODE_ENV === 'production' 
    ? uuid('id').primaryKey().defaultRandom()
    : text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: process.env.NODE_ENV === 'production'
    ? uuid('user_id').references(() => users.id)
    : text('user_id').references(() => users.id),
  amount: integer('amount').notNull(),
  status: text('status', { 
    enum: ['pending', 'approved', 'rejected', 'paid'] 
  }).default('pending'),
  created_at: timestamp('created_at').defaultNow(),
  processed_at: timestamp('processed_at'),
});

// Export all tables
export const schema = {
  users,
  mcpTools,
  agents,
  agentTools,
  userCredentials,
  toolUsageLogs,
  wallets,
  creditTransactions,
  purchases,
  reviews,
  payoutRequests,
};