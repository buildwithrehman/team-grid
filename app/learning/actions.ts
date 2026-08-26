'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLearningTarget(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const target_date = formData.get('target_date') as string
  const status = formData.get('status') as string || 'planned'

  const { error } = await supabase
    .from('learning_targets')
    .insert({
      user_id: user.id,
      title,
      description,
      target_date: target_date ? new Date(target_date).toISOString() : null,
      status
    })

  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}

export async function updateTargetStatus(targetId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('learning_targets').update({ status }).eq('id', targetId)
  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}

export async function createSkill(name: string, category: string) {
  const supabase = await createClient()
  // This triggers global insertion
  const { data, error } = await supabase.from('skills').insert({ name, category }).select().single()
  if (error) {
    // might already exist
    const { data: existing } = await supabase.from('skills').select().eq('name', name).single()
    if (existing) return existing
    throw new Error(error.message)
  }
  return data
}

export async function addUserSkill(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  let skill_id = formData.get('skill_id') as string
  const skill_name = formData.get('skill_name') as string
  const category = formData.get('category') as string
  const current_level = formData.get('current_level') as string

  // If skill doesn't exist, create it first
  if (!skill_id && skill_name) {
    const newSkill = await createSkill(skill_name, category)
    skill_id = newSkill.id
  }

  const { error } = await supabase
    .from('user_skills')
    .insert({
      user_id: user.id,
      skill_id,
      current_level
    })

  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}

export async function updateUserSkill(userSkillId: string, level: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('user_skills').update({ current_level: level }).eq('id', userSkillId)
  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}

export async function createLearningEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const learning_type = formData.get('learning_type') as string
  const project_id = formData.get('project_id') as string || null
  const status = formData.get('status') as string || 'planned'

  const { error } = await supabase
    .from('learning_entries')
    .insert({
      user_id: user.id,
      title,
      learning_type,
      status,
      project_id
    })

  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}

export async function updateLearningEntryStatus(entryId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('learning_entries').update({ status }).eq('id', entryId)
  if (error) throw new Error(error.message)
  revalidatePath('/learning')
}
