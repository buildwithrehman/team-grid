import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek } from 'date-fns'

// Safely fetches and maps recent tasks for a team
export async function buildTeamTasksContext(teamId: string) {
  const supabase = await createClient()
  
  // We fetch through project_members / tasks to ensure we only get tasks the user is authorized for
  // Wait, `is_team_member` on projects allows team members to see all projects in the team.
  // The query will automatically be filtered by RLS. We just need to query tasks belonging to projects in this team.
  
  const { data: projects } = await supabase.from('projects').select('id, name, status').eq('team_id', teamId)
  if (!projects || projects.length === 0) return { tasks: [] }
  
  const projectIds = projects.map(p => p.id)
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, priority, progress, updated_at, projects(name), profiles(full_name)')
    .in('project_id', projectIds)
    .order('updated_at', { ascending: false })
    .limit(50) // Hard limit to minimize context
    
  if (!tasks) return { tasks: [] }

  return {
    tasks: tasks.map(t => ({
      title: t.title,
      project: (t.projects as any)?.name,
      status: t.status,
      priority: t.priority,
      progress: `${t.progress}%`,
      assignee: (t.profiles as any)?.full_name || 'Unassigned',
      updated: t.updated_at
    }))
  }
}

export async function buildBlockersContext(teamId: string) {
  const supabase = await createClient()
  
  const { data: blockers } = await supabase
    .from('blockers')
    .select('title, description, status, severity, created_at, resolved_at, profiles(full_name)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(20)
    
  if (!blockers) return { blockers: [] }
  
  return {
    blockers: blockers.map(b => ({
      title: b.title,
      description: b.description,
      status: b.status,
      severity: b.severity,
      reporter: (b.profiles as any)?.full_name || 'Unknown',
      created: b.created_at,
      resolved: b.resolved_at
    }))
  }
}

export async function buildCheckinsContext(teamId: string) {
  const supabase = await createClient()
  
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0]
  
  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('accomplishments, priorities, blockers, week_start_date, profiles(full_name)')
    .eq('team_id', teamId)
    .gte('week_start_date', weekStart)
    .limit(30)
    
  if (!checkins) return { checkins: [] }
  
  return {
    checkins: checkins.map(c => ({
      member: (c.profiles as any)?.full_name || 'Unknown',
      accomplishments: c.accomplishments,
      priorities: c.priorities,
      blockers: c.blockers
    }))
  }
}

// For project health specifically
export async function buildProjectHealthContext(projectId: string) {
  const supabase = await createClient()
  
  const { data: project } = await supabase
    .from('projects')
    .select('name, status, target_date, project_stats(progress, total_tasks, completed_tasks)')
    .eq('id', projectId)
    .single()
    
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, priority')
    .eq('project_id', projectId)
    .neq('status', 'completed')
    .limit(20)
    
  return {
    project: {
      name: project?.name,
      status: project?.status,
      targetDate: project?.target_date,
      progress: project?.project_stats?.[0]?.progress || 0
    },
    openTasks: tasks?.map(t => ({ title: t.title, priority: t.priority, status: t.status })) || []
  }
}
