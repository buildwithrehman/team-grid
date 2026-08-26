import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlusCircle, Target } from 'lucide-react'
import { GoalsTabs } from '@/components/goals/GoalsTabs'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all accessible goals and stats
  const { data: goals, error } = await supabase
    .from('goals')
    .select(`
      *,
      profiles:owner_id (full_name, avatar_url),
      teams (name),
      projects (name)
    `)
    .order('created_at', { ascending: false })
    
  const { data: stats } = await supabase
    .from('goal_stats')
    .select('*')

  if (error) {
    console.error(error)
  }

  // merge stats into goals
  const goalsWithStats = goals?.map(g => {
    const stat = stats?.find(s => s.goal_id === g.id)
    return { ...g, stats: stat || { goal_progress: 0, total_krs: 0, completed_krs: 0 } }
  }) || []

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-8 h-8 text-indigo-600" /> Goals
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track and manage your strategic objectives.
          </p>
        </div>
      </div>

      <GoalsTabs goals={goalsWithStats} currentUserId={user.id} />
    </div>
  )
}
