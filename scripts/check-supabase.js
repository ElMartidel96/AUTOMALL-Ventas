/**
 * 🔍 Supabase Connection Checker
 *
 * Run with: node scripts/check-supabase.js
 */

require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL
const serviceKey = process.env.SUPABASE_DAO_SERVICE_KEY

console.log('🔍 Checking Supabase configuration...\n')

console.log('Environment Variables:')
console.log(`  SUPABASE_DAO_URL: ${url ? '✅ Set' : '❌ Missing'}`)
console.log(`  SUPABASE_DAO_SERVICE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`)
console.log()

if (!url || !serviceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

async function checkSupabase() {
  try {
    console.log('📡 Testing connection to:', url)

    const response = await fetch(`${url}/rest/v1/tasks?select=count`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Supabase API Error:', response.status, error)
      return
    }

    const data = await response.json()
    console.log('✅ Connection successful!')
    console.log('📊 Response:', JSON.stringify(data, null, 2))

    // Now get actual tasks
    console.log('\n📋 Fetching all tasks...')
    const tasksResponse = await fetch(`${url}/rest/v1/tasks?select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    if (!tasksResponse.ok) {
      const error = await tasksResponse.text()
      console.error('❌ Tasks fetch error:', tasksResponse.status, error)
      return
    }

    const tasks = await tasksResponse.json()
    console.log(`📊 Found ${tasks.length} tasks in database`)

    if (tasks.length === 0) {
      console.log('\n⚠️ No tasks found! You may need to initialize tasks.')
      console.log('Run: npx tsx scripts/init-tasks-direct.js')
    } else {
      console.log('\n✅ Tasks breakdown:')
      const statuses = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {})
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`)
      })
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause.message)
    }
  }
}

checkSupabase()
