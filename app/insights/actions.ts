'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  generateTeamWeeklySummary, 
  generateAttentionInsights, 
  generateBlockerInsights, 
  generateCheckinSummary 
} from '@/lib/ai/insights'
import { isAIConfigured } from '@/lib/ai/provider'

export async function fetchAIInsights(teamId: string, forceRefresh = false) {
  if (!isAIConfigured()) {
    return { error: 'GEMINI_API_KEY is not configured.' }
  }

  // Ensure user belongs to the team they are requesting insights for
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .single()

  if (!membership) throw new Error('Unauthorized: Not a team member')

  try {
    const [weeklySummary, attention, blockerInsights, checkinSummary] = await Promise.all([
      generateTeamWeeklySummary(teamId, forceRefresh).catch(e => { console.error(e); return null }),
      generateAttentionInsights(teamId, forceRefresh).catch(e => { console.error(e); return null }),
      generateBlockerInsights(teamId, forceRefresh).catch(e => { console.error(e); return null }),
      generateCheckinSummary(teamId, forceRefresh).catch(e => { console.error(e); return null })
    ])

    return { weeklySummary, attention, blockerInsights, checkinSummary }
  } catch (error: any) {
    console.error('AI Insight Generation Failed:', error)
    return { error: error.message || 'Failed to generate AI insights' }
  }
}
