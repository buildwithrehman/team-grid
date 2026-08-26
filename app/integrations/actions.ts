'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function createWebhook(teamId: string, url: string, events: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generate a random 32-byte hex secret
  const secret = crypto.randomBytes(32).toString('hex')

  const { data: integration, error } = await supabase.from('team_integrations').insert({
    team_id: teamId,
    url,
    subscribed_events: events,
    created_by: user.id
  }).select().single()

  if (error || !integration) throw new Error(error?.message || 'Failed to create integration')
  
  const { error: secretError } = await supabase.from('integration_secrets').insert({
    integration_id: integration.id,
    secret
  })

  if (secretError) throw new Error(secretError.message)

  revalidatePath('/integrations')
  return { ...integration, secret } // Return secret once for the modal
}

export async function updateWebhook(id: string, url: string, events: string[], status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('team_integrations').update({
    url,
    subscribed_events: events,
    status
  }).eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/integrations')
}

export async function deleteWebhook(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('team_integrations').delete().eq('id', id)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/integrations')
}
