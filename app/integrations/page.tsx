import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IntegrationsContainer } from '@/components/integrations/IntegrationsContainer'
import { Webhook, ShieldAlert } from 'lucide-react'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .limit(1)
    
  if (!teamMembers || teamMembers.length === 0) redirect('/onboarding')
  
  const teamId = teamMembers[0].team_id
  const role = teamMembers[0].role
  const canManage = role === 'admin' || role === 'team_leader'

  const { data: integrations } = await supabase
    .from('team_integrations')
    .select('id, team_id, provider, url, status, subscribed_events, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const { data: logs } = await supabase
    .from('integration_logs')
    .select('*, team_integrations(url, provider)')
    .eq('team_id', teamId)
    .order('attempted_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Webhook className="w-8 h-8 text-indigo-600" /> Integrations & Automation
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect Team Grid to external tools like n8n or Zapier using secure webhooks.
          </p>
        </div>
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-sm">You are a team member. You can view integration logs but you cannot create, edit, or view webhook secrets. Only Team Admins and Leaders can manage integrations.</p>
        </div>
      )}

      <IntegrationsContainer 
        teamId={teamId}
        integrations={integrations || []} 
        logs={logs || []}
        canManage={canManage}
      />
    </div>
  )
}
