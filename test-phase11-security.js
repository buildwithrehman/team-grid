require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const assert = require('assert')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env vars")
  process.exit(1)
}

const clientA = createClient(supabaseUrl, supabaseAnonKey)
const clientB = createClient(supabaseUrl, supabaseAnonKey)

async function runTests() {
  console.log("Starting Phase 11 Security Validation...")

  const password = 'password123'
  const emailA = `test_11a_${Date.now()}@test.com`
  const emailB = `test_11b_${Date.now()}@test.com`

  await clientA.auth.signUp({ email: emailA, password, options: { data: { full_name: 'Alice 11' } } })
  await clientB.auth.signUp({ email: emailB, password, options: { data: { full_name: 'Bob 11' } } })

  await clientA.auth.signInWithPassword({ email: emailA, password })
  await clientB.auth.signInWithPassword({ email: emailB, password })

  const userA = (await clientA.auth.getUser()).data.user
  const userB = (await clientB.auth.getUser()).data.user
  
  if (!userA || !userB) throw new Error("Users not created.")

  // Create teams using RPC
  const { data: teamIdA, error: errTeamA } = await clientA.rpc('create_team', { team_name: 'Team 11A', team_description: 'Test' })
  if (errTeamA) throw errTeamA
  
  const { data: teamIdB, error: errTeamB } = await clientB.rpc('create_team', { team_name: 'Team 11B', team_description: 'Test' })
  if (errTeamB) throw errTeamB

  console.log(`Team A: ${teamIdA}`)
  console.log(`Team B: ${teamIdB}`)

  // 1. Cross-Team Cache Isolation Test
  console.log("Testing AI Cache RLS Isolation...")
  
  // User A tries to insert a fake cache for Team A (should fail now, only server can insert)
  const { error: insertErrA } = await clientA.from('ai_insights_cache').insert({
    team_id: teamIdA,
    insight_type: 'weekly_summary',
    context_hash: 'testhash123',
    structured_data: { summary: "Team A rules" }
  })
  assert.ok(insertErrA, "User A MUST be blocked from inserting AI cache to prevent spoofing")

  // User B tries to read Team A's cache
  const { data: bViewsA, error: bViewsAErr } = await clientB.from('ai_insights_cache').select('*').eq('team_id', teamIdA)
  assert.ok(!bViewsAErr, "Should not error, just return empty")
  assert.strictEqual(bViewsA.length, 0, "User B MUST NOT see Team A's AI cache")

  // User B tries to insert a cache for Team A (spoofing team_id)
  const { error: bInsertsA } = await clientB.from('ai_insights_cache').insert({
    team_id: teamIdA,
    insight_type: 'weekly_summary',
    context_hash: 'spoofedhash',
    structured_data: { summary: "Team B hacking" }
  })
  assert.ok(bInsertsA, "User B MUST get an RLS policy violation when attempting to insert cache for Team A")

  console.log("RLS Cache Isolation Passed.")
  console.log("Phase 11 Validation Completed Successfully!")
  process.exit(0)
}

runTests().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
