'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Normally we would get the team_id from the user's active team or context.
  // For simplicity here, we fetch the first team they are an admin/leader of.
  const { data: teams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .in('role', ['admin', 'team_leader'])
    .limit(1)

  if (!teams || teams.length === 0) {
    throw new Error("You do not have permission to create a project in any team.")
  }

  const team_id = teams[0].team_id
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string || 'planning'
  const priority = formData.get('priority') as string || 'medium'
  const target_deadline = formData.get('target_deadline') as string
  
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      team_id,
      name,
      description,
      status,
      priority,
      target_deadline: target_deadline ? new Date(target_deadline).toISOString() : null,
      owner_id: user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Add the owner to project_members
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user.id
  })
  
  await logActivity({
    team_id,
    event_type: 'project_created',
    entity_type: 'project',
    entity_id: project.id,
    metadata: { name: project.name }
  })

  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function archiveProject(projectId: string) {
  const supabase = await createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .update({ is_archived: true })
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  if (project) {
    await logActivity({
      team_id: project.team_id,
      event_type: 'project_archived',
      entity_type: 'project',
      entity_id: project.id,
      metadata: { name: project.name }
    })
  }
  
  revalidatePath('/projects')
  redirect('/projects')
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const priority = formData.get('priority') as string
  const target_deadline = formData.get('target_deadline') as string

  const { error } = await supabase
    .from('projects')
    .update({
      name,
      description,
      status,
      priority,
      target_deadline: target_deadline ? new Date(target_deadline).toISOString() : null,
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
}

export async function addProjectMember(projectId: string, email: string) {
  const supabase = await createClient()

  // First, find the user by email
  // Note: Finding user by email usually requires admin api, or they must be in the team already.
  // Since they must be in the team, we can query profiles joined with team_members!
  // Wait, profiles email is not exposed unless we have a custom column.
  // Let's assume we add by user_id for simplicity right now, or we can look them up if full_name matches.
  // For the sake of this phase, let's just create the action structure.
  throw new Error("addProjectMember not fully implemented yet in UI")
}
