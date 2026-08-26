'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity, createNotification, getActorName } from '@/lib/activity'

export async function createTask(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_to = formData.get('assigned_to') as string || null
  const status = formData.get('status') as string || 'todo'
  const priority = formData.get('priority') as string || 'medium'
  const deadline = formData.get('deadline') as string

  // We need team_id to log activity. Let's get it from the project.
  const { data: project } = await supabase.from('projects').select('team_id, name').eq('id', projectId).single()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title,
      description,
      assigned_to: assigned_to ? assigned_to : null,
      created_by: user.id,
      status,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      progress: status === 'completed' ? 100 : 0
    }).select().single()

  if (error) throw new Error(error.message)

  if (project && task) {
    await logActivity({
      team_id: project.team_id,
      event_type: 'task_created',
      entity_type: 'task',
      entity_id: task.id,
      metadata: { title: task.title, project_name: project.name }
    })

    if (assigned_to) {
      const actorName = await getActorName()
      await createNotification({
        user_id: assigned_to,
        team_id: project.team_id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${actorName} assigned you to "${task.title}"`,
        related_entity_type: 'project',
        related_entity_id: projectId
      })
    }
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function updateTaskStatus(taskId: string, projectId: string, newStatus: string) {
  const supabase = await createClient()
  
  const payload: any = { status: newStatus }
  if (newStatus === 'completed') {
    payload.progress = 100
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('*, projects(team_id, name)')
    .single()

  if (error) throw new Error(error.message)

  if (task && task.projects) {
    await logActivity({
      team_id: task.projects.team_id,
      event_type: 'task_status_changed',
      entity_type: 'task',
      entity_id: task.id,
      metadata: { title: task.title, new_status: newStatus }
    })
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function updateTaskProgress(taskId: string, projectId: string, progress: number) {
  const supabase = await createClient()
  
  const payload: any = { progress }
  if (progress === 100) {
    payload.status = 'completed'
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('*, projects(team_id, name)')
    .single()

  if (error) throw new Error(error.message)
    
  if (task && task.projects && payload.status === 'completed') {
    await logActivity({
      team_id: task.projects.team_id,
      event_type: 'task_status_changed',
      entity_type: 'task',
      entity_id: task.id,
      metadata: { title: task.title, new_status: 'completed' }
    })
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function archiveTask(taskId: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
}
