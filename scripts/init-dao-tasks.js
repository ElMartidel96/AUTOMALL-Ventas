#!/usr/bin/env node
/**
 * 🚀 Initialize DAO Tasks Script
 * 
 * Calls the admin endpoint to create all 34 predefined tasks
 */

require('dotenv').config({ path: '.env.local' });

async function initializeTasks() {
  console.log('🚀 Initializing CryptoGift DAO Tasks...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crypto-gift-wallets-dao.vercel.app';
  const adminToken = process.env.ADMIN_DAO_API_TOKEN;
  
  if (!adminToken) {
    console.error('❌ Error: ADMIN_DAO_API_TOKEN not found in environment variables');
    console.log('Please set ADMIN_DAO_API_TOKEN in your .env.local file');
    process.exit(1);
  }
  
  try {
    console.log(`📡 Calling API: ${baseUrl}/api/admin/init-tasks`);
    
    const response = await fetch(`${baseUrl}/api/admin/init-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('\n✅ Tasks Initialization Results:');
    console.log('================================');
    
    if (data.summary) {
      console.log(`📊 Total Tasks: ${data.summary.total}`);
      console.log(`✅ Created: ${data.summary.created}`);
      console.log(`⏭️  Skipped (already exist): ${data.summary.skipped}`);
      console.log(`❌ Failed: ${data.summary.failed}`);
    }
    
    if (data.results && data.results.length > 0) {
      console.log('\n📋 Task Details:');
      console.log('----------------');
      data.results.forEach((result, index) => {
        const icon = result.created ? '✅' : result.exists ? '⏭️' : '❌';
        console.log(`${icon} ${index + 1}. ${result.title || 'Unknown'}`);
        if (result.error) {
          console.log(`   └─ Error: ${result.error}`);
        }
      });
    }
    
    console.log('\n🎉 Task initialization complete!');
    
    if (data.summary && data.summary.created > 0) {
      console.log(`\n🔗 View tasks at: ${baseUrl}/tasks`);
    }
    
  } catch (error) {
    console.error('\n❌ Failed to initialize tasks:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Check if the API is deployed and accessible');
    console.error('2. Verify ADMIN_DAO_API_TOKEN is correct');
    console.error('3. Check Supabase connection and credentials');
    console.error('4. Review server logs for more details');
    process.exit(1);
  }
}

// Run the script
initializeTasks().catch(console.error);