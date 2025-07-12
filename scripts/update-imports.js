#!/usr/bin/env node

/**
 * Update Imports Script
 * 
 * This script helps update existing API routes to use the new database abstraction.
 * It will replace old database imports with the new unified database import.
 * 
 * Usage: node scripts/update-imports.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to find and replace
const REPLACEMENTS = [
  {
    // Replace old database imports
    pattern: /import\s*{\s*sqlite\s*}\s*from\s*["']@\/lib\/database["']/g,
    replacement: `import { db, sqlite } from "@/lib/db"`
  },
  {
    // Replace old database imports with additional functions
    pattern: /import\s*{\s*sqlite,\s*encryptCredential,\s*decryptCredential\s*}\s*from\s*["']@\/lib\/database["']/g,
    replacement: `import { db, sqlite, encryptCredential, decryptCredential } from "@/lib/db"`
  },
  {
    // Replace old database imports with initializeDatabase
    pattern: /import\s*{\s*initializeDatabase,\s*sqlite\s*}\s*from\s*["']@\/lib\/database["']/g,
    replacement: `import { db, initializeDatabase, sqlite } from "@/lib/db"`
  },
  {
    // Replace old database imports with all functions
    pattern: /import\s*{\s*initializeDatabase,\s*sqlite,\s*encryptCredential,\s*decryptCredential\s*}\s*from\s*["']@\/lib\/database["']/g,
    replacement: `import { db, initializeDatabase, sqlite, encryptCredential, decryptCredential } from "@/lib/db"`
  }
];

// Direct database import patterns
const DIRECT_IMPORTS = [
  {
    pattern: /import\s*{\s*db\s*}\s*from\s*["']@\/lib\/database["']/g,
    replacement: `import { db } from "@/lib/db"`
  }
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply replacements
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
        console.log(`  ✅ Updated import pattern in ${path.basename(filePath)}`);
      }
    });
    
    // Apply direct imports
    DIRECT_IMPORTS.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
        console.log(`  ✅ Updated direct import in ${path.basename(filePath)}`);
      }
    });
    
    // Write back if changes were made
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Updating database imports to use new abstraction layer...\n');
  
  // Find all TypeScript and JavaScript files in the app directory
  const patterns = [
    'app/**/*.ts',
    'app/**/*.tsx',
    'app/**/*.js',
    'app/**/*.jsx',
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'lib/**/*.js',
    'lib/**/*.jsx'
  ];
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['node_modules/**'] });
    
    files.forEach(file => {
      totalFiles++;
      console.log(`📁 Processing: ${file}`);
      
      if (updateFile(file)) {
        updatedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total files processed: ${totalFiles}`);
  console.log(`  Files updated: ${updatedFiles}`);
  console.log(`  Files unchanged: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log(`\n✅ Import updates completed successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`1. Review the changes to ensure they look correct`);
    console.log(`2. Test your application to make sure everything works`);
    console.log(`3. If you encounter any issues, you can manually revert specific files`);
  } else {
    console.log(`\nℹ️  No files needed updating. Your imports are already up to date!`);
  }
  
  console.log(`\n💡 Note: You may need to restart your development server for changes to take effect.`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, updateFile };