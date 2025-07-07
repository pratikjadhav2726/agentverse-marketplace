const { initializeDatabase, sqlite } = require('./lib/database.ts');

console.log('Testing database initialization...');

try {
  // Initialize the database
  initializeDatabase();
  
  // Test queries
  console.log('\n=== Testing Database Queries ===');
  
  // Get all users
  const users = sqlite.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
  });
  
  // Get all agents
  const agents = sqlite.prepare('SELECT * FROM agents').all();
  console.log(`\nFound ${agents.length} agents:`);
  agents.forEach(agent => {
    console.log(`  - ${agent.name} - Price: ${agent.price_per_use_credits} credits`);
  });
  
  // Get all wallets
  const wallets = sqlite.prepare('SELECT * FROM wallets').all();
  console.log(`\nFound ${wallets.length} wallets:`);
  wallets.forEach(wallet => {
    console.log(`  - User ID: ${wallet.user_id} - Balance: ${wallet.balance} credits`);
  });
  
  console.log('\n✅ Database test completed successfully!');
  
} catch (error) {
  console.error('❌ Database test failed:', error);
  process.exit(1);
}

// Close the database connection
sqlite.close();
console.log('Database connection closed.');