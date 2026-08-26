'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentWeekBoundaries } from '@/lib/dateUtils'
import { logActivity } from '@/lib/activity'

export async function saveWeeklyCheckin(teamId: string, formData: FormData, isSubmit: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { week_start_date, week_end_date } = getCurrentWeekBoundaries()

  const payload = {
    user_id: user.id,
    team_id: teamId,
    week_start_date,
    week_end_date,
    accomplishments: formData.get('accomplishments') as string,
    current_work: formData.get('current_work') as string,
    next_week_focus: formData.get('next_week_focus') as string,
    learning_reflection: formData.get('learning_reflection') as string,
    confidence_level: parseInt(formData.get('confidence_level') as string) || 3,
    status: isSubmit ? 'submitted' : 'draft',
    updated_at: new Date().toISOString()
  }

  // Check if it already exists to determine insert vs update
  const { data: existing } = await supabase
    .from('weekly_checkins')
    .select('id, status, submitted_at')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .eq('week_start_date', week_start_date)
    .single()

  let justSubmitted = false;
  let checkinId = existing?.id;

  if (existing) {
    const updatePayload: any = { ...payload }
    if (isSubmit && existing.status !== 'submitted') {
      updatePayload.submitted_at = new Date().toISOString()
      justSubmitted = true
    }
    const { error } = await supabase
      .from('weekly_checkins')
      .update(updatePayload)
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
  } else {
    const insertPayload: any = { ...payload }
    if (isSubmit) {
      insertPayload.submitted_at = new Date().toISOString()
      justSubmitted = true
    }
    const { data: newCheckin, error } = await supabase
      .from('weekly_checkins')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    checkinId = newCheckin.id
  }
  
  if (justSubmitted && checkinId) {
    await logActivity({
      team_id: teamId,
      event_type: 'checkin_submitted',
      entity_type: 'checkin',
      entity_id: checkinId,
      metadata: { week: week_start_date }
    })
  }

  revalidatePath('/checkins')
  revalidatePath('/dashboard')
}
