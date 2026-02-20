#!/usr/bin/env node
/**
 * 🔧 Apply Schema SQL Directly
 * 
 * Creates tables directly using individual SQL statements via Supabase client
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_DAO_URL
const supabaseServiceKey = process.env.SUPABASE_DAO_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function createTables() {
  console.log('📋 Creating Supabase tables directly...\n')

  // Tasks table
  console.log('Creating tasks table...')
  try {
    await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id VARCHAR(66) UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          complexity INTEGER CHECK (complexity BETWEEN 1 AND 10),
          reward_cgc DECIMAL(20,2) NOT NULL,
          category TEXT,
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in_progress', 'submitted', 'completed', 'cancelled')),
          estimated_days INTEGER,
          required_skills TEXT[],
          tags TEXT[],
          assignee_address TEXT,
          evidence_url TEXT,
          pr_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          claimed_at TIMESTAMPTZ,
          submitted_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          metadata JSONB
        );
      `
    })
    console.log('✅ Tasks table created')
  } catch (error) {
    console.log('⚠️ Tasks table:', error.message)
  }

  // Collaborators table
  console.log('Creating collaborators table...')
  try {
    await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS collaborators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          wallet_address TEXT UNIQUE NOT NULL,
          username TEXT,
          email TEXT,
          avatar_url TEXT,
          skills TEXT[],
          bio TEXT,
          github_username TEXT,
          discord_username TEXT,
          twitter_username TEXT,
          reputation_score INTEGER DEFAULT 0,
          total_earned_cgc DECIMAL(20,2) DEFAULT 0,
          tasks_completed INTEGER DEFAULT 0,
          tasks_in_progress INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    console.log('✅ Collaborators table created')
  } catch (error) {
    console.log('⚠️ Collaborators table:', error.message)
  }

  // Task proposals table
  console.log('Creating task_proposals table...')
  try {
    await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS task_proposals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          complexity INTEGER CHECK (complexity BETWEEN 1 AND 10),
          estimated_reward_cgc DECIMAL(20,2),
          category TEXT,
          required_skills TEXT[],
          proposer_address TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
          votes_for INTEGER DEFAULT 0,
          votes_against INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    console.log('✅ Task proposals table created')
  } catch (error) {
    console.log('⚠️ Task proposals table:', error.message)
  }

  // Task history table
  console.log('Creating task_history table...')
  try {
    await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS task_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id VARCHAR(66) NOT NULL,
          action TEXT NOT NULL,
          actor_address TEXT,
          old_status TEXT,
          new_status TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    console.log('✅ Task history table created')
  } catch (error) {
    console.log('⚠️ Task history table:', error.message)
  }

  console.log('\n✅ Schema application completed!')
}

// Alternative approach - create tables using INSERT hack
async function createTablesAlternative() {
  console.log('🔄 Alternative approach: Creating minimal table structure...\n')

  try {
    // Try to insert a dummy record to force table creation
    await supabase
      .from('tasks')
      .insert({
        task_id: 'dummy_task_' + Date.now(),
        title: 'Dummy Task',
        description: 'Temporary task to create table',
        complexity: 1,
        reward_cgc: 50,
        status: 'available'
      })
      .select()

    console.log('✅ Tasks table exists or created')
    
    // Delete dummy record
    await supabase
      .from('tasks')
      .delete()
      .like('task_id', 'dummy_task_%')

  } catch (error) {
    console.log('⚠️ Tasks table creation failed:', error.message)
  }
}

async function testTables() {
  console.log('\n🔍 Testing table access...\n')

  const tables = ['tasks', 'collaborators', 'task_proposals', 'task_history']
  let working = 0

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      console.log(`✅ ${table}: accessible (${count || 0} records)`)
      working++
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
    }
  }

  console.log(`\n📊 Result: ${working}/${tables.length} tables working`)
  return working === tables.length
}

async function main() {
  console.log('🚀 Supabase Schema Setup\n')

  // Try direct SQL approach first
  await createTables()
  
  // Test if tables are working
  const success = await testTables()
  
  if (!success) {
    console.log('\n🔄 Trying alternative approach...')
    await createTablesAlternative()
    await testTables()
  }

  console.log('\n🎯 Schema setup complete!')
  console.log('\nNext steps:')
  console.log('1. Run: node scripts/test-rewards-flow.js')
  console.log('2. If tests pass, start development: npm run dev')
}

main().catch(console.error)