export type HealthStatus = 'healthy' | 'at_risk' | 'critical'

export interface ProjectHealthResult {
  status: HealthStatus
  reasons: string[]
}

export function calculateProjectHealth(project: any, tasks: any[], milestones: any[], stats: any): ProjectHealthResult {
  const reasons: string[] = []
  let status: HealthStatus = 'healthy'
  
  if (project.is_archived) {
    return { status: 'healthy', reasons: ['Project is archived'] }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(today.getDate() + 7)

  // 1. Task calculations
  const activeTasks = tasks.filter(t => t.status !== 'completed' && !t.is_archived)
  const overdueTasks = activeTasks.filter(t => t.deadline && new Date(t.deadline) < today)
  
  // 2. Milestone calculations
  const overdueMilestones = milestones.filter(m => 
    m.status !== 'completed' && 
    (m.status === 'missed' || (m.target_date && new Date(m.target_date) < today))
  )

  // 3. Project Deadline
  let projectOverdue = false
  let projectDueSoon = false
  if (project.target_deadline && stats?.project_progress < 100) {
    const pDate = new Date(project.target_deadline)
    if (pDate < today) projectOverdue = true
    else if (pDate <= sevenDaysFromNow) projectDueSoon = true
  }

  // Determine Critical
  if (projectOverdue) {
    status = 'critical'
    reasons.push('Project deadline has passed with incomplete work')
  } else if (overdueTasks.length >= 3) {
    status = 'critical'
    reasons.push(`${overdueTasks.length} tasks are overdue`)
  } else if (overdueMilestones.length >= 2) {
    status = 'critical'
    reasons.push(`${overdueMilestones.length} milestones are overdue or missed`)
  } 
  // Determine At Risk
  else if (status === 'healthy') {
    if (projectDueSoon && stats?.project_progress < 80) {
      status = 'at_risk'
      reasons.push('Deadline approaching with progress under 80%')
    } else if (overdueTasks.length > 0) {
      status = 'at_risk'
      reasons.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue`)
    } else if (overdueMilestones.length > 0) {
      status = 'at_risk'
      reasons.push(`${overdueMilestones.length} milestone overdue or missed`)
    }
  }

  if (status === 'healthy') {
    reasons.push('Project is progressing normally')
  }

  return { status, reasons }
}
