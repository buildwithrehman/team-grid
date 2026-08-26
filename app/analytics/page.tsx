import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeamAnalytics } from '@/lib/calculations/analytics'
import { TeamAnalyticsClient } from '@/components/analytics/TeamAnalyticsClient'
import { BarChart3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).limit(1)
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  
  const teamId = teamMembers[0].team_id
  
  const analyticsData = await getTeamAnalytics(teamId)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" /> Team Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Insights based on real operational data. Historical progress lines are omitted where accurate completion timestamps do not exist.
          </p>
        </div>
      </div>

      <TeamAnalyticsClient data={analyticsData} />
    </div>
  )
}
