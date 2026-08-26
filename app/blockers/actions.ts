'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity, createNotification, getActorName } from '@/lib/activity'

export async function createBlocker(teamId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const severity = formData.get('severity') as string || 'medium'
  const related_project_id = formData.get('related_project_id') as string || null
  const related_task_id = formData.get('related_task_id') as string || null

  const { data: blocker, error } = await supabase
    .from('blockers')
    .insert({
      team_id: teamId,
      reported_by: user.id,
      title,
      description,
      severity,
      related_project_id,
      related_task_id
    }).select().single()

  if (error) throw new Error(error.message)
  
  // Log Activity
  await logActivity({
    team_id: teamId,
    event_type: 'blocker_created',
    entity_type: 'blocker',
    entity_id: blocker.id,
    metadata: { title, severity }
  })

  // Notify Team if Critical
  if (severity === 'critical') {
    const actorName = await getActorName()
    const { data: teamMembers } = await supabase.from('team_members').select('user_id').eq('team_id', teamId)
    if (teamMembers) {
      for (const member of teamMembers) {
        if (member.user_id !== user.id) {
          await createNotification({
            user_id: member.user_id,
            team_id: teamId,
            type: 'critical_blocker_reported',
            title: 'Critical Blocker Reported',
            message: `${actorName} reported a critical blocker: ${title}`,
            related_entity_type: 'blockers',
            related_entity_id: blocker.id
          })
        }
      }
    }
  }

  revalidatePath('/blockers')
  revalidatePath('/dashboard')
}

export async function updateBlockerStatus(blockerId: string, status: string) {
  const supabase = await createClient()
  const { data: blocker, error } = await supabase.from('blockers').update({ status }).eq('id', blockerId).select().single()
  if (error) throw new Error(error.message)
  
  if (status === 'resolved') {
    await logActivity({
      team_id: blocker.team_id,
      event_type: 'blocker_resolved',
      entity_type: 'blocker',
      entity_id: blocker.id,
      metadata: { title: blocker.title }
    })
    
    // Notify reporter if resolved by someone else
    const { data: { user } } = await supabase.auth.getUser()
    if (user && blocker.reported_by && blocker.reported_by !== user.id) {
      const actorName = await getActorName()
      await createNotification({
        user_id: blocker.reported_by,
        team_id: blocker.team_id,
        type: 'blocker_resolved',
        title: 'Blocker Resolved',
        message: `${actorName} resolved your blocker: ${blocker.title}`,
        related_entity_type: 'blockers',
        related_entity_id: blocker.id
      })
    }
  }

  revalidatePath('/blockers')
  revalidatePath('/dashboard')
}
