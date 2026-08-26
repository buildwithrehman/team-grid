import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BlockersOverview } from '@/components/blockers/BlockersOverview'
import { CreateBlockerModal } from '@/components/blockers/CreateBlockerModal'
import { AlertOctagon } from 'lucide-react'

export default async function BlockersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).limit(1)
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  const teamId = teamMembers[0].team_id

  const { data: blockers } = await supabase
    .from('blockers')
    .select(`
      *,
      profiles:reported_by (full_name),
      projects:related_project_id (name)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('team_id', teamId)
    .eq('is_archived', false)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-8 h-8 text-red-600" /> Team Blockers
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Identify, track, and resolve impediments blocking the team.
          </p>
        </div>
        <div className="w-full sm:w-auto"><CreateBlockerModal teamId={teamId} projects={projects || []} /></div>
      </div>

      <BlockersOverview blockers={blockers || []} />
    </div>
  )
}
