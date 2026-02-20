#!/usr/bin/env node
/**
 * 🔍 Check DAO System Status
 * 
 * Verifies all integrations and displays current status
 */

require('dotenv').config({ path: '.env.local' });

async function checkStatus() {
  console.log('🔍 CryptoGift DAO System Status Check\n');
  console.log('=' .repeat(50));
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crypto-gift-wallets-dao.vercel.app';
  
  // 1. Check Tasks API
  console.log('\n📋 TASKS SYSTEM:');
  console.log('-'.repeat(30));
  try {
    const tasksResponse = await fetch(`${baseUrl}/api/tasks`);
    const tasksData = await tasksResponse.json();
    
    if (tasksResponse.ok && tasksData.tasks) {
      console.log(`✅ Tasks API: Working`);
      console.log(`📊 Total Tasks: ${tasksData.tasks.length}`);
      
      // Count by status
      const statusCount = {};
      tasksData.tasks.forEach(task => {
        statusCount[task.status] = (statusCount[task.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Show first 5 tasks
      if (tasksData.tasks.length > 0) {
        console.log('\n📝 Sample Tasks:');
        tasksData.tasks.slice(0, 5).forEach((task, i) => {
          console.log(`   ${i + 1}. ${task.title} (${task.status})`);
        });
      }
    } else {
      console.log(`❌ Tasks API: Failed or no tasks`);
      if (tasksData.error) {
        console.log(`   Error: ${tasksData.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ Tasks API: Connection failed`);
    console.log(`   Error: ${error.message}`);
  }
  
  // 2. Check Leaderboard API
  console.log('\n🏆 LEADERBOARD SYSTEM:');
  console.log('-'.repeat(30));
  try {
    const leaderboardResponse = await fetch(`${baseUrl}/api/leaderboard`);
    const leaderboardData = await leaderboardResponse.json();
    
    if (leaderboardResponse.ok && leaderboardData.leaderboard) {
      console.log(`✅ Leaderboard API: Working`);
      console.log(`👥 Total Contributors: ${leaderboardData.leaderboard.length}`);
      
      // Show top 3
      if (leaderboardData.leaderboard.length > 0) {
        console.log('\n🥇 Top Contributors:');
        leaderboardData.leaderboard.slice(0, 3).forEach((user, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          console.log(`   ${medal} ${user.username || 'Anonymous'} - ${user.total_cgc_earned || 0} CGC`);
        });
      }
    } else {
      console.log(`❌ Leaderboard API: Failed`);
      if (leaderboardData.error) {
        console.log(`   Error: ${leaderboardData.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ Leaderboard API: Connection failed`);
    console.log(`   Error: ${error.message}`);
  }
  
  // 3. Check Proposals API
  console.log('\n📜 PROPOSALS SYSTEM:');
  console.log('-'.repeat(30));
  try {
    const proposalsResponse = await fetch(`${baseUrl}/api/proposals`);
    const proposalsData = await proposalsResponse.json();
    
    if (proposalsResponse.ok && proposalsData.proposals) {
      console.log(`✅ Proposals API: Working`);
      console.log(`📊 Total Proposals: ${proposalsData.proposals.length}`);
      
      if (proposalsData.proposals.length > 0) {
        console.log('\n📝 Recent Proposals:');
        proposalsData.proposals.slice(0, 3).forEach((proposal, i) => {
          console.log(`   ${i + 1}. ${proposal.title} (${proposal.status})`);
        });
      }
    } else {
      console.log(`❌ Proposals API: Failed`);
      if (proposalsData.error) {
        console.log(`   Error: ${proposalsData.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ Proposals API: Connection failed`);
    console.log(`   Error: ${error.message}`);
  }
  
  // 4. Check Environment Variables
  console.log('\n⚙️  CONFIGURATION:');
  console.log('-'.repeat(30));
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_DAO_URL',
    'NEXT_PUBLIC_SUPABASE_DAO_ANON_KEY',
    'ADMIN_DAO_API_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ];
  
  let configOk = true;
  requiredEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${varName}: ${exists ? 'Set' : 'Missing'}`);
    if (!exists) configOk = false;
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(50));
  
  if (configOk) {
    console.log('\n✅ Local configuration looks good!');
    console.log('\n⚠️  Note: If tasks are not showing in production:');
    console.log('1. Ensure Supabase env vars are set in Vercel');
    console.log('2. Run the init-tasks endpoint to populate database');
    console.log('3. Check Supabase dashboard for data');
  } else {
    console.log('\n⚠️  Some configuration is missing.');
    console.log('Please check your .env.local file.');
  }
  
  console.log('\n🔗 Useful Links:');
  console.log(`   - App: ${baseUrl}`);
  console.log(`   - Tasks: ${baseUrl}/tasks`);
  console.log(`   - Leaderboard: ${baseUrl}/leaderboard`);
  console.log(`   - Admin Init: ${baseUrl}/api/admin/init-tasks (POST with Bearer token)`);
}

// Run the script
checkStatus().catch(console.error);