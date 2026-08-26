import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase, Sparkles, CheckSquare, Flag, Target, ClipboardList } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ProjectHealthOverview } from '@/components/dashboard/ProjectHealthOverview'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines'
import { WorkloadSummary } from '@/components/dashboard/WorkloadSummary'
import { calculateProjectHealth } from '@/lib/calculations/projectHealth'
import { calculateUpcomingDeadlines } from '@/lib/calculations/deadlines'
import { calculateTeamWorkload } from '@/lib/calculations/workload'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch user's team membership to restrict queries
  const { data: userTeams } = await supabase.from('team_members').select('team_id').eq('user_id', user.id)
  const teamIds = userTeams?.map(t => t.team_id) || []

  if (teamIds.length === 0) {
    redirect('/onboarding')
  }

  // 2. Fetch Projects (filtered implicitly by RLS, but we explicit filter by team_id for clarity)
  const { data: projects } = await supabase.from('projects').select('*').in('team_id', teamIds)
  const { data: projectStats } = await supabase.from('project_stats').select('*')
  
  // 3. Fetch Tasks related to these projects
  const projectIds = projects?.map(p => p.id) || []
  const { data: tasks } = await supabase.from('tasks').select('*, projects(name)').in('project_id', projectIds)

  // 4. Fetch Milestones related to these projects
  const { data: milestones } = await supabase.from('milestones').select('*, projects(name)').in('project_id', projectIds)

  // 5. Fetch Goals related to these teams
  const { data: goals } = await supabase.from('goals').select('*') // RLS handles scoping to user/team

  // 6. Fetch Team Members for Workload
  const { data: teamMembers } = await supabase.from('team_members').select('user_id, profiles(full_name, avatar_url)').in('team_id', teamIds)

  // Deduplicate members across multiple teams
  const uniqueMembersMap = new Map()
  teamMembers?.forEach(tm => uniqueMembersMap.set(tm.user_id, tm))
  const uniqueMembers = Array.from(uniqueMembersMap.values())

  // --- Calculate Metrics ---
  const activeProjects = projects?.filter(p => !p.is_archived) || []
  const activeProjectIds = new Set(activeProjects.map(p => p.id))
  
  const activeTasks = tasks?.filter(t => !t.is_archived && t.status !== 'completed' && activeProjectIds.has(t.project_id)) || []
  const upcomingMilestones = milestones?.filter(m => (m.status === 'upcoming' || m.status === 'in_progress') && activeProjectIds.has(m.project_id)) || []
  const activeGoals = goals?.filter(g => (g.status === 'in_progress' || g.status === 'not_started' || g.status === 'at_risk') && (!g.project_id || activeProjectIds.has(g.project_id))) || []

  // --- Calculate Project Health ---
  const healthData = activeProjects.map(p => {
    const pTasks = tasks?.filter(t => t.project_id === p.id) || []
    const pMilestones = milestones?.filter(m => m.project_id === p.id) || []
    const pStats = projectStats?.find(s => s.project_id === p.id) || { project_progress: 0 }
    
    const health = calculateProjectHealth(p, pTasks, pMilestones, pStats)
    return {
      id: p.id,
      name: p.name,
      status: health.status,
      reasons: health.reasons
    }
  }).sort((a, b) => {
    const scores = { critical: 0, at_risk: 1, healthy: 2 }
    return scores[a.status] - scores[b.status]
  })

  // --- Calculate Deadlines & Workload ---
  const deadlines = calculateUpcomingDeadlines(activeProjects, activeTasks, upcomingMilestones)
  const workload = calculateTeamWorkload(uniqueMembers, activeTasks)

  // --- Phase 7 Integration ---
  const { getCurrentWeekBoundaries } = await import('@/lib/dateUtils')
  const boundaries = getCurrentWeekBoundaries()

  const { data: teamBlockers } = await supabase
    .from('blockers')
    .select('id, status, severity')
    .in('team_id', teamIds)
    .eq('status', 'open')

  const openBlockers = teamBlockers?.length || 0
  const criticalBlockers = teamBlockers?.filter(b => b.severity === 'critical').length || 0

  const { data: teamCheckins } = await supabase
    .from('weekly_checkins')
    .select('id, user_id')
    .in('team_id', teamIds)
    .eq('week_start_date', boundaries.week_start_date)
    .eq('status', 'submitted')

  const checkinsSubmitted = teamCheckins?.length || 0
  const missingCheckins = uniqueMembers.length - checkinsSubmitted

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your command center for project health and team activity.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <details className="sm:hidden group">
            <summary className="flex h-9 w-full cursor-pointer list-none items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-[#111827] dark:text-gray-200">
              <span>Team navigation</span>
              <span className="text-lg leading-none transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <nav className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]" aria-label="Team navigation">
              <Link href="/projects" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Projects</Link>
              <Link href="/goals" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Goals</Link>
              <Link href="/learning" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Learning</Link>
              <Link href="/checkins" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Check-ins</Link>
              <Link href="/blockers" className="rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Blockers</Link>
              <Link href="/activity" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Activity</Link>
              <Link href="/analytics" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Analytics</Link>
              <Link href="/insights" className="flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20"><Sparkles className="h-3 w-3"/> Insights</Link>
              <Link href="/integrations" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Integrations</Link>
              <Link href="/notifications" className="rounded-md px-2 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Notifications</Link>
              <form action={logout} className="col-span-2">
                <Button variant="outline" size="sm" className="w-full">Logout</Button>
              </form>
            </nav>
          </details>

          <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-2 items-center justify-end">
            <Link href="/projects" className="text-sm font-medium text-[#4F46E5] hover:underline">Projects</Link>
            <Link href="/goals" className="text-sm font-medium text-[#4F46E5] hover:underline">Goals</Link>
            <Link href="/learning" className="text-sm font-medium text-[#4F46E5] hover:underline">Learning</Link>
            <Link href="/checkins" className="text-sm font-medium text-[#4F46E5] hover:underline">Check-ins</Link>
            <Link href="/blockers" className="text-sm font-medium text-red-600 hover:underline">Blockers</Link>
            <Link href="/activity" className="text-sm font-medium text-[#4F46E5] hover:underline">Activity</Link>
            <Link href="/analytics" className="text-sm font-medium text-[#4F46E5] hover:underline">Analytics</Link>
            <Link href="/insights" className="text-sm font-medium text-[#4F46E5] hover:underline flex items-center gap-1"><Sparkles className="w-3 h-3"/> Insights</Link>
            <Link href="/integrations" className="text-sm font-medium text-[#4F46E5] hover:underline">Integrations</Link>
            <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <NotificationBell notifications={notifications || []} />
            <form action={logout}>
              <Button variant="outline" size="sm">Logout</Button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <CheckSquare className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Open Blockers</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{openBlockers}</p>
            {criticalBlockers > 0 && <p className="text-xs text-red-500 font-medium mt-1">{criticalBlockers} Critical</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <ClipboardList className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Team Check-ins</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{checkinsSubmitted} <span className="text-sm font-normal text-gray-500">/ {uniqueMembers.length}</span></p>
            {missingCheckins > 0 && <p className="text-xs text-orange-500 font-medium mt-1">{missingCheckins} Missing</p>}
          </div>
        </div>

        <MetricCard 
          title="Active Projects" 
          value={activeProjects.length} 
          icon={Briefcase} 
          colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <MetricCard 
          title="Upcoming Milestones" 
          value={upcomingMilestones.length} 
          icon={Flag} 
          colorClass="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectHealthOverview projects={healthData} />
        </div>
        <div>
          <UpcomingDeadlines items={deadlines} />
        </div>
        <WorkloadSummary workload={workload} />
      </div>
    </div>
  )
}
