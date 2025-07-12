#!/usr/bin/env node

/**
 * Data Migration Script: SQLite to Supabase
 * 
 * This script exports data from your local SQLite database and provides
 * SQL statements to import it into your Supabase database.
 * 
 * Usage:
 * 1. Run this script: node scripts/migrate-data.js
 * 2. Copy the generated SQL from the output
 * 3. Run the SQL in your Supabase SQL Editor
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = path.join(process.cwd(), 'agentverse.db');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'supabase-import.sql');

// Tables to migrate (in order to respect foreign key constraints)
const TABLES = [
  'users',
  'mcp_tools', 
  'agents',
  'agent_tools',
  'user_credentials',
  'tool_usage_logs',
  'wallets',
  'credit_transactions',
  'purchases',
  'reviews',
  'payout_requests'
];

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function formatValue(value, columnType) {
  if (value === null || value === undefined) return 'NULL';
  
  switch (columnType) {
    case 'TEXT':
    case 'VARCHAR':
      return escapeString(value);
    case 'INTEGER':
      return parseInt(value) || 0;
    case 'BOOLEAN':
      return value ? 'true' : 'false';
    case 'DATETIME':
    case 'TIMESTAMP':
      return value ? `'${value}'` : 'NULL';
    case 'UUID':
      // Convert SQLite text IDs to UUIDs
      if (typeof value === 'string' && value.includes('-')) {
        return escapeString(value);
      } else {
        return escapeString(generateUUID());
      }
    default:
      return escapeString(value);
  }
}

function migrateTable(db, tableName) {
  console.log(`Migrating table: ${tableName}`);
  
  try {
    // Get table schema
    const schemaQuery = db.prepare(`PRAGMA table_info(${tableName})`);
    const columns = schemaQuery.all();
    
    // Get all data
    const dataQuery = db.prepare(`SELECT * FROM ${tableName}`);
    const rows = dataQuery.all();
    
    if (rows.length === 0) {
      console.log(`  No data found in ${tableName}`);
      return '';
    }
    
    console.log(`  Found ${rows.length} rows`);
    
    // Generate INSERT statements
    let sql = `\n-- Migrate ${tableName} table\n`;
    sql += `-- ${rows.length} rows to import\n\n`;
    
    // Handle large datasets by batching
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      sql += `INSERT INTO ${tableName} (`;
      sql += columns.map(col => col.name).join(', ');
      sql += ') VALUES\n';
      
      const values = batch.map(row => {
        const rowValues = columns.map(col => {
          const value = row[col.name];
          return formatValue(value, col.type);
        });
        return `(${rowValues.join(', ')})`;
      });
      
      sql += values.join(',\n');
      sql += '\nON CONFLICT (id) DO NOTHING;\n\n';
    }
    
    return sql;
    
  } catch (error) {
    console.error(`Error migrating table ${tableName}:`, error.message);
    return `-- Error migrating ${tableName}: ${error.message}\n`;
  }
}

function main() {
  console.log('🚀 Starting SQLite to Supabase data migration...\n');
  
  // Check if SQLite database exists
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ SQLite database not found at: ${SQLITE_DB_PATH}`);
    console.log('Make sure you have run the application at least once to create the SQLite database.');
    process.exit(1);
  }
  
  try {
    // Open SQLite database
    const db = new Database(SQLITE_DB_PATH);
    console.log(`✅ Connected to SQLite database: ${SQLITE_DB_PATH}\n`);
    
    // Generate migration SQL
    let migrationSQL = `-- SQLite to Supabase Data Migration\n`;
    migrationSQL += `-- Generated on: ${new Date().toISOString()}\n`;
    migrationSQL += `-- Run this in your Supabase SQL Editor\n\n`;
    
    // Add UUID extension
    migrationSQL += `-- Enable UUID extension\n`;
    migrationSQL += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    
    // Migrate each table
    for (const tableName of TABLES) {
      const tableSQL = migrateTable(db, tableName);
      migrationSQL += tableSQL;
    }
    
    // Add footer
    migrationSQL += `-- Migration completed!\n`;
    migrationSQL += `-- Verify your data by running: SELECT COUNT(*) FROM users;\n`;
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, migrationSQL);
    
    console.log(`✅ Migration SQL generated successfully!`);
    console.log(`📁 Output file: ${OUTPUT_FILE}\n`);
    
    console.log(`📋 Next steps:`);
    console.log(`1. Copy the contents of ${OUTPUT_FILE}`);
    console.log(`2. Go to your Supabase project dashboard`);
    console.log(`3. Navigate to SQL Editor`);
    console.log(`4. Paste and run the migration SQL`);
    console.log(`5. Verify your data has been imported correctly\n`);
    
    // Close database
    db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { main };