import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentWeekBoundaries, formatWeekLabel } from '@/lib/dateUtils'
import { TeamCheckinsOverview } from '@/components/checkins/TeamCheckinsOverview'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TeamCheckinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).limit(1)
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  const teamId = teamMembers[0].team_id

  const boundaries = getCurrentWeekBoundaries()

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, profiles(full_name)')
    .eq('team_id', teamId)

  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('team_id', teamId)
    .eq('week_start_date', boundaries.week_start_date)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" /> Team Check-ins
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {formatWeekLabel(boundaries.week_start_date)}
          </p>
        </div>
        <div>
          <Link href="/checkins">
            <Button variant="outline">My Check-in</Button>
          </Link>
        </div>
      </div>

      <TeamCheckinsOverview members={members || []} checkins={checkins || []} />
    </div>
  )
}
