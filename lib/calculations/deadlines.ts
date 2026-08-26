export interface DeadlineItem {
  id: string
  title: string
  type: 'project' | 'milestone' | 'task'
  date: Date
  isOverdue: boolean
  contextInfo: string
  url: string
}

export function calculateUpcomingDeadlines(projects: any[], tasks: any[], milestones: any[]): DeadlineItem[] {
  const items: DeadlineItem[] = []
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fourteenDaysFromNow = new Date(today)
  fourteenDaysFromNow.setDate(today.getDate() + 14)

  const isRelevant = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d <= fourteenDaysFromNow
  }

  const checkOverdue = (dateStr: string) => {
    const d = new Date(dateStr)
    return d < today
  }

  projects.forEach(p => {
    if (!p.is_archived && p.target_deadline && isRelevant(p.target_deadline)) {
      items.push({
        id: `p_${p.id}`,
        title: p.name,
        type: 'project',
        date: new Date(p.target_deadline),
        isOverdue: checkOverdue(p.target_deadline),
        contextInfo: 'Project Target',
        url: `/projects/${p.id}`
      })
    }
  })

  tasks.forEach(t => {
    if (!t.is_archived && t.status !== 'completed' && t.deadline && isRelevant(t.deadline)) {
      items.push({
        id: `t_${t.id}`,
        title: t.title,
        type: 'task',
        date: new Date(t.deadline),
        isOverdue: checkOverdue(t.deadline),
        contextInfo: `Task in ${t.projects?.name || 'Project'}`,
        url: `/projects/${t.project_id}`
      })
    }
  })

  milestones.forEach(m => {
    if (m.status !== 'completed' && m.target_date && isRelevant(m.target_date)) {
      items.push({
        id: `m_${m.id}`,
        title: m.title,
        type: 'milestone',
        date: new Date(m.target_date),
        isOverdue: checkOverdue(m.target_date) || m.status === 'missed',
        contextInfo: `Milestone in ${m.projects?.name || 'Project'}`,
        url: `/projects/${m.project_id}`
      })
    }
  })

  return items.sort((a, b) => a.date.getTime() - b.date.getTime())
}
