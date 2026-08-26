import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { InsightsDashboardClient } from '@/components/insights/InsightsDashboardClient'

export default async function AIInsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)
    
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  
  const teamId = teamMembers[0].team_id

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-500" /> Team AI Insights
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Privacy-aware, AI-generated synthesis of your team's weekly data.
          </p>
        </div>
      </div>

      <InsightsDashboardClient teamId={teamId} />
    </div>
  )
}
