import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, sqlite } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database initialization...');
    
    // Initialize the database
    initializeDatabase();
    
    // Test queries
    const results = {
      status: 'success',
      message: 'Database test completed successfully',
      data: {
        users: [] as any[],
        agents: [] as any[],
        wallets: [] as any[],
        tables_created: true
      }
    };
    
    // Get all users
    const users = sqlite.prepare('SELECT * FROM users').all();
    results.data.users = users;
    console.log(`Found ${users.length} users`);
    
    // Get all agents
    const agents = sqlite.prepare('SELECT * FROM agents').all();
    results.data.agents = agents;
    console.log(`Found ${agents.length} agents`);
    
    // Get all wallets
    const wallets = sqlite.prepare('SELECT * FROM wallets').all();
    results.data.wallets = wallets;
    console.log(`Found ${wallets.length} wallets`);
    
    console.log('✅ Database test completed successfully!');
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}