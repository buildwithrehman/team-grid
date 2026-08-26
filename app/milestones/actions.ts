'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMilestone(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const target_date = formData.get('target_date') as string
  const status = formData.get('status') as string || 'upcoming'

  const { error } = await supabase
    .from('milestones')
    .insert({
      project_id: projectId,
      title,
      description,
      status,
      target_date: target_date ? new Date(target_date).toISOString() : null,
      created_by: user.id
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}

export async function updateMilestoneStatus(milestoneId: string, projectId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId)

  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}
