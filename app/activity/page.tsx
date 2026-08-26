import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { ActivityFeed } from '@/components/activity/ActivityFeed'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase.from('team_members').select('team_id').eq('user_id', user.id)
  const teamIds = teamMembers?.map(t => t.team_id) || []

  if (teamIds.length === 0) redirect('/onboarding')

  const { data: activityEvents } = await supabase
    .from('activity_events')
    .select('*, profiles:actor_id(full_name)')
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" /> Team Activity
          </h1>
          <p className="mt-1 text-sm text-gray-500">Chronological history of meaningful events.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <ActivityFeed events={activityEvents || []} />
      </div>
    </div>
  )
}
