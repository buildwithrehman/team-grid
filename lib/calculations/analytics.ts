import { createClient } from '@/lib/supabase/server'
import { subDays, subWeeks, startOfWeek, formatISO, eachWeekOfInterval, isBefore } from 'date-fns'

export async function getTeamAnalytics(teamId: string) {
  const supabase = await createClient()

  // Verify access implicitly via querying (RLS handles it)
  // But let's fetch raw data first
  const { data: projects } = await supabase.from('projects').select('*').eq('team_id', teamId).eq('is_archived', false)
  const activeProjects = projects || []
  const activeProjectIds = activeProjects.map(p => p.id)

  let tasks: any[] = []
  if (activeProjectIds.length > 0) {
    const { data: t } = await supabase.from('tasks').select('*').in('project_id', activeProjectIds).eq('is_archived', false)
    tasks = t || []
  }

  const { data: blockersData } = await supabase.from('blockers').select('*').eq('team_id', teamId)
  const blockers = blockersData || []

  const { data: teamMembers } = await supabase.from('team_members').select('user_id').eq('team_id', teamId)
  const memberCount = teamMembers?.length || 0

  // 1. Project Status Distribution
  const projectStatusDistribution = activeProjects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})
  const projectStatusData = Object.entries(projectStatusDistribution).map(([name, value]) => ({ name, value }))

  // 2. Task Summary
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length

  // 3. Blockers Trend (Last 30 Days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentBlockers = blockers.filter(b => new Date(b.created_at) >= thirtyDaysAgo)
  
  // Group blockers by creation week or day? Let's just do totals for the metric cards, and a weekly trend line.
  // Let's create a 4-week trend for blockers
  const now = new Date()
  const fourWeeksAgo = subWeeks(now, 4)
  const weeks = eachWeekOfInterval({ start: fourWeeksAgo, end: now }, { weekStartsOn: 1 })
  
  const blockerTrends = weeks.map(weekStart => {
    const weekStr = weekStart.toISOString().split('T')[0]
    const nextWeek = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const created = blockers.filter(b => {
      const d = new Date(b.created_at)
      return d >= weekStart && d < nextWeek
    }).length

    const resolved = blockers.filter(b => {
      if (!b.resolved_at) return false
      const d = new Date(b.resolved_at)
      return d >= weekStart && d < nextWeek
    }).length

    return { week: weekStr, created, resolved }
  }).slice(0, 4) // Keep it to 4 weeks

  // 4. Check-in Consistency (Last 4 Weeks)
  let checkinTrends: any[] = []
  if (memberCount > 0) {
    const { data: checkins } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'submitted')
      .gte('week_start_date', formatISO(fourWeeksAgo, { representation: 'date' }))

    checkinTrends = weeks.map(weekStart => {
      const weekStr = formatISO(weekStart, { representation: 'date' })
      const submissions = checkins?.filter(c => c.week_start_date === weekStr).length || 0
      const expected = memberCount
      const rate = expected > 0 ? Math.round((submissions / expected) * 100) : 0
      return { week: weekStr, rate, submissions, expected }
    }).slice(0, 4)
  }

  return {
    activeProjectCount: activeProjects.length,
    openBlockerCount: blockers.filter(b => b.status === 'open').length,
    totalTasks,
    completedTasks,
    projectStatusData,
    blockerTrends,
    checkinTrends
  }
}
