import { createTeam } from '@/app/onboarding/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if they already have a team
  const { data: teams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)

  if (teams && teams.length > 0) {
    redirect('/dashboard')
  }

  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-[#0B0D12] p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-10">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Welcome to Team Grid</h1>
          <p className="text-gray-500 dark:text-gray-400">Let&apos;s get started by creating your first team.</p>
        </div>

        <form action={createTeam} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" name="name" placeholder="e.g. Engineering, Marketing" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" name="description" placeholder="Briefly describe your team's purpose" />
          </div>

          {params.error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">
              {params.error}
            </div>
          )}

          <Button type="submit" className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            Create Team
          </Button>
        </form>
      </div>
    </div>
  )
}
