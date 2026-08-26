'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const goal_type = formData.get('goal_type') as string
  const target_date = formData.get('target_date') as string
  
  let team_id = null
  let project_id = null

  if (goal_type === 'team') team_id = formData.get('team_id') as string
  if (goal_type === 'project') {
    project_id = formData.get('project_id') as string
    // Project goals don't strictly require team_id to be stored locally if project_id is set, but it can be.
  }

  const { error } = await supabase
    .from('goals')
    .insert({
      title,
      description,
      goal_type,
      owner_id: user.id,
      team_id,
      project_id,
      created_by: user.id,
      target_date: target_date ? new Date(target_date).toISOString() : null
    })

  if (error) throw new Error(error.message)
  revalidatePath('/goals')
}

export async function updateGoalStatus(goalId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('goals').update({ status }).eq('id', goalId)
  if (error) throw new Error(error.message)
  revalidatePath('/goals')
  revalidatePath(`/goals/${goalId}`)
}

export async function createKeyResult(goalId: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const target_value = parseFloat(formData.get('target_value') as string)
  const current_value = parseFloat(formData.get('current_value') as string || '0')

  const { error } = await supabase
    .from('key_results')
    .insert({
      goal_id: goalId,
      title,
      target_value,
      current_value
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/goals/${goalId}`)
}

export async function updateKeyResultValue(krId: string, goalId: string, newValue: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('key_results')
    .update({ current_value: newValue })
    .eq('id', krId)
  if (error) throw new Error(error.message)
  revalidatePath(`/goals/${goalId}`)
  revalidatePath('/goals')
}
