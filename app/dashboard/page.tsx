import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's teams
  const { data: teams } = await supabase
    .from('team_members')
    .select('teams(name, description), role')
    .eq('user_id', user.id)

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <form action={logout}>
          <Button variant="outline">Logout</Button>
        </form>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Teams</h2>
        {teams?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((member: any, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-[#111827] border rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-[#4F46E5]">{member.teams?.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{member.teams?.description}</p>
                <span className="text-xs font-medium uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Role: {member.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You don't belong to any teams yet.</p>
        )}
      </div>
    </div>
  )
}
