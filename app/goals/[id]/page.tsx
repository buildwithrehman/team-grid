import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, Settings, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyResultsList } from '@/components/goals/KeyResultsList'

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      profiles:owner_id (full_name, avatar_url),
      teams (name),
      projects (name)
    `)
    .eq('id', id)
    .single()

  if (error || !goal) {
    redirect('/goals')
  }

  const { data: keyResults } = await supabase
    .from('key_results')
    .select('*')
    .eq('goal_id', id)
    .order('created_at', { ascending: true })

  const { data: stats } = await supabase
    .from('goal_stats')
    .select('*')
    .eq('goal_id', id)
    .single()

  const progress = stats?.goal_progress || 0

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/goals" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Goals
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="capitalize border-indigo-200 text-indigo-700 bg-indigo-50">
                {goal.goal_type} Goal
              </Badge>
              <Badge variant="outline" className="capitalize">
                {goal.status.replace('_', ' ')}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {goal.title}
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              {goal.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Edit Goal
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Progress</h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-[#4F46E5]">{progress}%</span>
              <span className="text-sm text-gray-500">
                ({stats?.completed_krs || 0} of {stats?.total_krs || 0} completed)
              </span>
            </div>
          </div>
          <div className="text-right text-sm">
            <span className="block text-gray-500 mb-1">Target Date</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'None'}
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4F46E5] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" /> Key Results
          </h2>
        </div>
        <KeyResultsList goalId={goal.id} keyResults={keyResults || []} />
      </div>
    </div>
  )
}
