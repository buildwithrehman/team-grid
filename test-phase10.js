require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
const http = require('http')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // use service role to bypass auth for test setup

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  // 1. Get a test team
  const { data: team } = await supabase.from('teams').select('id, name').limit(1).single()
  if (!team) throw new Error("No teams found")
  
  // 2. Start a local dummy HTTP server to act as n8n webhook receiver
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      console.log(`[Webhook Received] ${req.method} ${req.url}`)
      console.log(`[Signature Header]`, req.headers['x-teamgrid-signature'])
      console.log(`[Event Header]`, req.headers['x-teamgrid-event'])
      console.log(`[Body]`, body)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    })
  })

  server.listen(9999, async () => {
    console.log("Local test webhook server listening on port 9999")
    
    // 3. Create a test integration
    const secret = crypto.randomBytes(32).toString('hex')
    const { data: intg, error: intgError } = await supabase.from('team_integrations').insert({
      team_id: team.id,
      url: 'http://localhost:9999/webhook',
      status: 'active',
      secret: secret,
      subscribed_events: ['task_created']
    }).select().single()

    if (intgError) throw intgError
    console.log(`Created webhook integration for team ${team.name} (${team.id})`)

    // 4. We can't directly trigger Next.js Server Actions from here without spinning up the Next.js server.
    // We will just directly call the API or simulate the DB activity payload
    // Wait, logActivity is a TS function that depends on Next.js auth headers (cookies).
    // Let's just create a dummy task and see if any DB trigger fires it? No, dispatchWebhooks is in logActivity.
    // I will write a simple TS script and run it using ts-node or just compile it?
    // Let's just fetch the Next.js API or use curl.
    console.log("Since dispatchWebhooks runs in Next.js Server Actions based on cookies, please verify manually or via UI.")
    
    // Clean up
    await supabase.from('team_integrations').delete().eq('id', intg.id)
    server.close()
    process.exit(0)
  })
}

run().catch(console.error)
