import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'

interface ActivityPayload {
  team_id: string
  event_type: string
  entity_type: string
  entity_id: string
  metadata?: any
}

interface NotificationPayload {
  user_id: string
  team_id: string
  type: string
  title: string
  message: string
  related_entity_type: string
  related_entity_id: string
}

export async function logActivity(payload: ActivityPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('activity_events').insert({
    team_id: payload.team_id,
    actor_id: user.id,
    event_type: payload.event_type,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    metadata: payload.metadata || {}
  })

  // Phase 10: Dispatch Webhooks asynchronously (fire and forget)
  dispatchWebhooks(payload, user.id).catch(err => console.error('Webhook dispatch failed:', err))
}

export async function createNotification(payload: NotificationPayload) {
  const supabase = await createClient()
  
  // Prevent self-notifications
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.id === payload.user_id) return

  await supabase.from('notifications').insert({
    user_id: payload.user_id,
    team_id: payload.team_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    related_entity_type: payload.related_entity_type,
    related_entity_id: payload.related_entity_id
  })
}

export async function getActorName() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Someone'
  
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  return profile?.full_name?.split(' ')[0] || 'Someone'
}

async function dispatchWebhooks(payload: ActivityPayload, actorId: string) {
  const supabase = await createClient()
  
  // 1. Fetch active integrations for the team
  const { data: integrations } = await supabase
    .from('team_integrations')
    .select('*')
    .eq('team_id', payload.team_id)
    .eq('status', 'active')

  if (!integrations || integrations.length === 0) return

  // 2. Filter integrations subscribed to this event_type
  const relevantIntegrations = integrations.filter(intg => 
    Array.isArray(intg.subscribed_events) && 
    (intg.subscribed_events.includes(payload.event_type) || intg.subscribed_events.includes('*'))
  )

  if (relevantIntegrations.length === 0) return

  const webhookPayload = {
    event: payload.event_type,
    team_id: payload.team_id,
    actor_id: actorId,
    entity: {
      type: payload.entity_type,
      id: payload.entity_id
    },
    metadata: payload.metadata || {},
    timestamp: new Date().toISOString()
  }

  const payloadString = JSON.stringify(webhookPayload)

  // 3. Dispatch to each relevant integration
  for (const integration of relevantIntegrations) {
    // Fetch secret using secure RPC via Service Role
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: secret } = await adminClient.rpc('get_integration_secret', { intg_id: integration.id })

    if (!secret) continue

    const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3-second strict timeout

    let status = 'failed'
    let httpStatus = null
    let errorSummary = null

    try {
      const response = await fetch(integration.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teamgrid-signature': signature,
          'x-teamgrid-event': payload.event_type
        },
        body: payloadString,
        signal: controller.signal
      })

      httpStatus = response.status
      if (response.ok) {
        status = 'success'
      } else {
        errorSummary = `HTTP Error ${response.status}: ${response.statusText}`
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        status = 'timeout'
        errorSummary = 'Connection timed out after 3000ms'
      } else {
        errorSummary = error.message || 'Unknown network error'
      }
    } finally {
      clearTimeout(timeoutId)
    }

    // 4. Log the result
    await supabase.from('integration_logs').insert({
      integration_id: integration.id,
      team_id: payload.team_id,
      event_type: payload.event_type,
      status,
      http_status: httpStatus,
      error_summary: errorSummary,
      completed_at: new Date().toISOString()
    })
  }
}

