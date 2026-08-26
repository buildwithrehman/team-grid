export type WorkloadLevel = 'Light' | 'Moderate' | 'Heavy'

export interface MemberWorkload {
  userId: string
  fullName: string
  avatarUrl?: string
  activeTaskCount: number
  level: WorkloadLevel
}

export function calculateWorkloadLevel(taskCount: number): WorkloadLevel {
  if (taskCount <= 3) return 'Light'
  if (taskCount <= 7) return 'Moderate'
  return 'Heavy'
}

export function calculateTeamWorkload(members: any[], tasks: any[]): MemberWorkload[] {
  const activeTasks = tasks.filter(t => t.status !== 'completed' && !t.is_archived && t.assigned_to)
  
  return members.map(m => {
    const userTasks = activeTasks.filter(t => t.assigned_to === m.user_id)
    return {
      userId: m.user_id,
      fullName: m.profiles?.full_name || 'Unknown',
      avatarUrl: m.profiles?.avatar_url,
      activeTaskCount: userTasks.length,
      level: calculateWorkloadLevel(userTasks.length)
    }
  }).sort((a, b) => b.activeTaskCount - a.activeTaskCount) // Sort heaviest first
}
