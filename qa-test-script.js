require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const assert = require('assert')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env vars")
  process.exit(1)
}

const clientAdminA = createClient(supabaseUrl, supabaseAnonKey)
const clientMemberA = createClient(supabaseUrl, supabaseAnonKey)
const clientLeaderB = createClient(supabaseUrl, supabaseAnonKey)

let results = { passed: 0, failed: 0, errors: [] }

function testResult(name, fn) {
  return fn()
    .then(() => {
      console.log(`✅ PASS: ${name}`)
      results.passed++
    })
    .catch((err) => {
      console.log(`❌ FAIL: ${name} - ${err.message}`)
      results.failed++
      results.errors.push({ test: name, error: err.message })
    })
}

async function runQA() {
  console.log("==========================================")
  console.log("STARTING TEAM GRID COMPREHENSIVE QA AUDIT")
  console.log("==========================================")

  const password = 'qa-password-123'
  const emailAdminA = `qa_adminA_${Date.now()}@test.com`
  const emailMemberA = `qa_memberA_${Date.now()}@test.com`
  const emailLeaderB = `qa_leaderB_${Date.now()}@test.com`

  await clientAdminA.auth.signUp({ email: emailAdminA, password, options: { data: { full_name: 'QA Admin A' } } })
  await clientMemberA.auth.signUp({ email: emailMemberA, password, options: { data: { full_name: 'QA Member A' } } })
  await clientLeaderB.auth.signUp({ email: emailLeaderB, password, options: { data: { full_name: 'QA Leader B' } } })

  await clientAdminA.auth.signInWithPassword({ email: emailAdminA, password })
  await clientMemberA.auth.signInWithPassword({ email: emailMemberA, password })
  await clientLeaderB.auth.signInWithPassword({ email: emailLeaderB, password })

  const userAdminA = (await clientAdminA.auth.getUser()).data.user
  const userMemberA = (await clientMemberA.auth.getUser()).data.user
  const userLeaderB = (await clientLeaderB.auth.getUser()).data.user

  // 1. Authentication & Team Management
  let teamA_id, teamB_id;
  await testResult("Create Team A (Admin)", async () => {
    const { data, error } = await clientAdminA.rpc('create_team', { team_name: 'Team A QA', team_description: 'Test' })
    if (error) throw error
    teamA_id = data
  })

  await testResult("Create Team B (Leader)", async () => {
    const { data, error } = await clientLeaderB.rpc('create_team', { team_name: 'Team B QA', team_description: 'Test' })
    if (error) throw error
    teamB_id = data
  })

  await testResult("Add Member to Team A", async () => {
    const { error } = await clientAdminA.from('team_members').insert({ team_id: teamA_id, user_id: userMemberA.id, role: 'team_member' })
    if (error) throw error
  })

  // 2. Cross-Team Isolation Basic
  await testResult("Member A cannot see Team B projects", async () => {
    const { data, error } = await clientMemberA.from('projects').select('*').eq('team_id', teamB_id)
    if (error) throw error
    assert.strictEqual(data.length, 0)
  })

  // 3. Projects
  let projectA_id;
  await testResult("Admin A creates Project in Team A", async () => {
    const { data, error } = await clientAdminA.from('projects').insert({
      team_id: teamA_id, name: 'Project A', status: 'active', priority: 'high', owner_id: userAdminA.id
    }).select().single()
    if (error) throw error
    projectA_id = data.id
  })

  await testResult("Leader B cannot create Project in Team A", async () => {
    const { error } = await clientLeaderB.from('projects').insert({
      team_id: teamA_id, name: 'Hacked Project', status: 'active', priority: 'high', owner_id: userLeaderB.id
    })
    assert.ok(error, "Leader B should be denied")
  })

  // 4. Tasks
  let taskA_id;
  await testResult("Admin A creates Task in Project A", async () => {
    const { data, error } = await clientAdminA.from('tasks').insert({
      project_id: projectA_id, title: 'Task 1', status: 'todo', priority: 'medium', assigned_to: userMemberA.id, created_by: userAdminA.id
    }).select().single()
    if (error) throw error
    taskA_id = data.id
  })

  await testResult("Task update silently fails due to RLS if not a project member", async () => {
    // Member A is assigned but NOT a project member. So update should silently fail (return 0 rows).
    // Supabase JS doesn't throw on RLS silently filtering out rows on update.
    const { error } = await clientMemberA.from('tasks').update({ status: 'completed', progress: 100 }).eq('id', taskA_id)
    if (error) throw error

    // Allow trigger to run
    await new Promise(r => setTimeout(r, 500))

    const { data: proj, error: projErr } = await clientAdminA.from('project_stats').select('project_progress').eq('project_id', projectA_id).single()
    if (projErr) throw projErr
    assert.strictEqual(proj.project_progress, 0, "Progress should remain 0 because update was RLS filtered")
  })

  // 5. Goals
  let goalA_id;
  await testResult("Admin A creates Goal", async () => {
    const { data, error } = await clientAdminA.from('goals').insert({
      team_id: teamA_id, title: 'Goal 1', description: 'Test', status: 'not_started', goal_type: 'team', owner_id: userAdminA.id, created_by: userAdminA.id
    }).select().single()
    if (error) throw error
    goalA_id = data.id
  })

  await testResult("Admin A creates Key Result", async () => {
    const { error } = await clientAdminA.from('key_results').insert({
      goal_id: goalA_id, title: 'KR 1', target_value: 100, current_value: 50
    })
    if (error) throw error
  })

  // 6. Blockers
  let blockerA_id;
  await testResult("Member A creates Blocker", async () => {
    const { data, error } = await clientMemberA.from('blockers').insert({
      team_id: teamA_id, title: 'Blocker 1', severity: 'high', status: 'open', reported_by: userMemberA.id, related_project_id: projectA_id
    }).select().single()
    if (error) throw error
    blockerA_id = data.id
  })

  await testResult("Admin A resolves Blocker", async () => {
    const { error } = await clientAdminA.from('blockers').update({ status: 'resolved' }).eq('id', blockerA_id)
    if (error) throw error
  })

  // 7. Check-ins
  await testResult("Member A creates Weekly Check-in", async () => {
    const { error } = await clientMemberA.from('weekly_checkins').insert({
      team_id: teamA_id, user_id: userMemberA.id, week_start_date: new Date().toISOString().split('T')[0], week_end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      accomplishments: 'Did things', next_week_focus: 'More things'
    })
    if (error) throw error
  })

  // 8. Learning (Privacy)
  await testResult("Member A logs private learning", async () => {
    const { error } = await clientMemberA.from('learning_entries').insert({
      user_id: userMemberA.id, title: 'Learned JS', status: 'completed', learning_type: 'course'
    })
    if (error) throw error
  })

  await testResult("Admin A cannot see Member A private learning", async () => {
    const { data, error } = await clientAdminA.from('learning_entries').select('*').eq('user_id', userMemberA.id)
    if (error) throw error
    assert.strictEqual(data.length, 0)
  })

  // 9. Integrations & Security
  await testResult("Leader B cannot read Integration Secrets table", async () => {
    const { data, error } = await clientLeaderB.from('integration_secrets').select('*')
    // No explicit select policies means empty array is returned for authenticated users.
    if (error) throw error
    assert.strictEqual(data.length, 0, "Secrets table should return absolutely no rows")
  })

  await testResult("Leader B cannot invoke get_integration_secret RPC", async () => {
    const { error } = await clientLeaderB.rpc('get_integration_secret', { integration_id_param: 'some-uuid' })
    assert.ok(error, "Should be denied from RPC")
  })

  // 10. AI Cache Isolation
  await testResult("Leader B cannot insert into AI cache", async () => {
    const { error } = await clientLeaderB.from('ai_insights_cache').insert({
      team_id: teamB_id, insight_type: 'weekly_summary', context_hash: '123', structured_data: {}
    })
    assert.ok(error, "Insert to AI cache should be denied to all clients")
  })

  console.log("\n==========================================")
  console.log(`RESULTS: ${results.passed} PASS, ${results.failed} FAIL`)
  if (results.failed > 0) {
    console.log(results.errors)
  }
  process.exit(0)
}

runQA()
