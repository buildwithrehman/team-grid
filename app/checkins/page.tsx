import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentWeekBoundaries, formatWeekLabel } from '@/lib/dateUtils'
import { WeeklyCheckinForm } from '@/components/checkins/WeeklyCheckinForm'
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CheckinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get active team
  const { data: teamMembers } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).limit(1)
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  const teamId = teamMembers[0].team_id

  const boundaries = getCurrentWeekBoundaries()

  const { data: checkin } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .eq('week_start_date', boundaries.week_start_date)
    .single()

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-indigo-600" /> My Weekly Check-in
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {formatWeekLabel(boundaries.week_start_date)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/checkins/team">
            <Button variant="outline">Team Overview</Button>
          </Link>
          <Link href="/blockers">
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Blockers
            </Button>
          </Link>
        </div>
      </div>

      <WeeklyCheckinForm teamId={teamId} existingData={checkin} />
    </div>
  )
}
