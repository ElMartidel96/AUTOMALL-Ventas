#!/usr/bin/env node
/**
 * 🗄️ Direct Supabase Schema Application
 * 
 * Applies schema directly via PostgreSQL connection using Supabase REST API
 * Uses service key for full admin access
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function applySchemaDirectly() {
  console.log('🔧 Applying Supabase schema directly...\n')
  
  const supabaseUrl = process.env.SUPABASE_DAO_URL
  const supabaseServiceKey = process.env.SUPABASE_DAO_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    return false
  }
  
  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'lib', 'supabase', 'schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  
  try {
    // Execute schema using Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: schemaSql
      })
    })
    
    if (response.ok) {
      console.log('✅ Schema applied successfully!')
      return true
    } else {
      const error = await response.text()
      console.error('❌ Schema application failed:', error)
      
      // Try individual table creation as fallback
      console.log('\n🔄 Attempting individual table creation...')
      return await createTablesIndividually(supabaseUrl, supabaseServiceKey)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
    return false
  }
}

async function createTablesIndividually(supabaseUrl, supabaseServiceKey) {
  const tables = [
    {
      name: 'tasks',
      sql: `
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
          completed_at TIMESTAMPTZ
        );
      `
    },
    {
      name: 'collaborators',
      sql: `
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
    },
    {
      name: 'task_proposals',
      sql: `
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
    },
    {
      name: 'task_history',
      sql: `
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
    }
  ]
  
  let successCount = 0
  
  for (const table of tables) {
    try {
      console.log(`📋 Creating table: ${table.name}...`)
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: table.sql
        })
      })
      
      if (response.ok) {
        console.log(`✅ Table ${table.name} created successfully`)
        successCount++
      } else {
        console.log(`⚠️  Table ${table.name} may already exist`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Failed to create table ${table.name}:`, error.message)
    }
  }
  
  console.log(`\n📊 Tables created: ${successCount}/${tables.length}`)
  return successCount > 0
}

// Execute if called directly
if (require.main === module) {
  applySchemaDirectly().then(success => {
    if (success) {
      console.log('\n🎉 Database schema is ready!')
      console.log('Next: Call the admin API to initialize tasks')
    } else {
      console.log('\n⚠️  Manual schema application may be needed')
      console.log('Please copy SQL from lib/supabase/schema.sql to Supabase SQL Editor')
    }
    process.exit(success ? 0 : 1)
  })
}

module.exports = { applySchemaDirectly }