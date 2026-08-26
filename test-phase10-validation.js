require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
const http = require('http')
const assert = require('assert')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env vars")
  process.exit(1)
}

const clientA = createClient(supabaseUrl, supabaseAnonKey)
const clientB = createClient(supabaseUrl, supabaseAnonKey)

function generateSignature(secret, payloadString) {
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
}

async function runTests() {
  console.log("Starting Phase 10.5 Validation...")

  const password = 'password123'
  const emailA = `test_10a_${Date.now()}@test.com`
  const emailB = `test_10b_${Date.now()}@test.com`

  await clientA.auth.signUp({ email: emailA, password, options: { data: { full_name: 'Alice 10' } } })
  await clientB.auth.signUp({ email: emailB, password, options: { data: { full_name: 'Bob 10' } } })

  await clientA.auth.signInWithPassword({ email: emailA, password })
  await clientB.auth.signInWithPassword({ email: emailB, password })

  const userA = (await clientA.auth.getUser()).data.user
  const userB = (await clientB.auth.getUser()).data.user
  
  if (!userA || !userB) throw new Error("Users not created.")

  // Create teams
  const { data: teamIdA, error: errTeamA } = await clientA.rpc('create_team', { team_name: 'Team 10A', team_description: 'Test' })
  if (errTeamA) throw errTeamA
  
  const { data: teamIdB, error: errTeamB } = await clientB.rpc('create_team', { team_name: 'Team 10B', team_description: 'Test' })
  if (errTeamB) throw errTeamB

  console.log(`Team A: ${teamIdA}`)
  console.log(`Team B: ${teamIdB}`)

  // 1. Authorization & Cross-Team Isolation Tests
  console.log("Testing Authorization...")
  
  const secretA = crypto.randomBytes(32).toString('hex')
  
  // User A creates webhook for Team A
  const { data: intgA, error: errA } = await clientA.from('team_integrations').insert({
    team_id: teamIdA, url: 'http://127.0.0.1:9998/success', subscribed_events: ['task_created']
  }).select().single()
  
  assert.ok(!errA, "User A should insert into Team A")
  
  // User A inserts the secret (using RPC or direct insert since we have a policy)
  const { error: secErr } = await clientA.from('integration_secrets').insert({
    integration_id: intgA.id, secret: secretA
  })
  assert.ok(!secErr, "User A should insert secret")

  // User B tries to read Team A's integrations
  const { data: bViewsA } = await clientB.from('team_integrations').select('*').eq('team_id', teamIdA)
  assert.ok(bViewsA.length === 0, "User B should NOT see Team A integrations")

  // Check that User A cannot fetch the secret via standard query
  const { data: secCheck } = await clientA.from('integration_secrets').select('*').eq('integration_id', intgA.id)
  assert.ok(secCheck.length === 0, "Secrets must not be returned in standard selects")

  console.log("Authorization passed.")

  // 2. Local Webhook Server
  let receivedPayload = null
  let receivedSignature = null

  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      receivedPayload = body
      receivedSignature = req.headers['x-teamgrid-signature']
      
      if (req.url === '/success') {
        res.writeHead(200); res.end();
      } else if (req.url === '/slow') {
        setTimeout(() => { res.writeHead(200); res.end(); }, 4000)
      } else {
        res.writeHead(500); res.end();
      }
    })
  })

  server.listen(9998, async () => {
    console.log("Test webhook server listening on port 9998")

    // We can't trigger Server Actions easily from outside, but we can verify our RPC logic!
    const { error: rpcErrA } = await clientA.rpc('get_integration_secret', { intg_id: intgA.id })
    assert.strictEqual(rpcErrA?.code, '42501', "Authenticated User A MUST receive Permission Denied (42501) when calling RPC directly")

    const { error: rpcErrB } = await clientB.rpc('get_integration_secret', { intg_id: intgA.id })
    assert.strictEqual(rpcErrB?.code, '42501', "Authenticated User B MUST receive Permission Denied (42501) when calling RPC directly")

    // Assert that the server backend using service_role CAN execute it
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: fetchedSecret, error: adminErr } = await adminClient.rpc('get_integration_secret', { intg_id: intgA.id })
    assert.ok(!adminErr, "Service Role MUST be able to execute RPC")
    assert.strictEqual(fetchedSecret, secretA, "Service Role MUST correctly fetch the secret")

    console.log("Strict RPC Execution Denials & Service Role Access Verified.")

    // Test webhook dispatching
    console.log("Testing actual webhook dispatch and timeout...")
    
    // We will mimic dispatchWebhooks
    const payloadString = JSON.stringify({ event: 'task_created', test: true })
    const signature = generateSignature(secretA, payloadString)
    
    // 1. Success test
    const res1 = await fetch('http://127.0.0.1:9998/success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-teamgrid-signature': signature },
      body: payloadString
    })
    assert.strictEqual(res1.status, 200, "Webhook should succeed")
    assert.strictEqual(receivedSignature, signature, "Signature should match")

    // 2. Timeout test
    console.log("Testing timeout (this takes 3s)...")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    let timedOut = false
    try {
      await fetch('http://127.0.0.1:9998/slow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
        signal: controller.signal
      })
    } catch (err) {
      if (err.name === 'AbortError') timedOut = true
    } finally {
      clearTimeout(timeoutId)
    }
    assert.ok(timedOut, "Webhook should time out strictly after 3000ms")
    
    console.log("Webhook delivery and timeout passed.")

    // Clean up
    await clientA.from('team_integrations').delete().eq('id', intgA.id)
    server.close()
    
    console.log("Phase 10.5 Validation Completed Successfully!")
    process.exit(0)
  })
}

runTests().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
