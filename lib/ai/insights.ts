import { generateObject } from 'ai'
import { getAIProvider } from './provider'
import { 
  WeeklySummarySchema, 
  AttentionSchema, 
  ProjectHealthExplanationSchema, 
  BlockerInsightsSchema,
  CheckinSummarySchema
} from './schemas'
import { 
  buildTeamTasksContext, 
  buildBlockersContext, 
  buildCheckinsContext,
  buildProjectHealthContext
} from './context'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

async function getCachedInsight<T>(teamId: string, insightType: string, contextHash: string): Promise<T | null> {
  const supabase = await createClient()
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  
  const { data } = await supabase
    .from('ai_insights_cache')
    .select('structured_data')
    .eq('team_id', teamId)
    .eq('insight_type', insightType)
    .eq('context_hash', contextHash)
    .gte('created_at', fourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  return data?.structured_data as T | null
}

async function setCachedInsight(teamId: string, insightType: string, contextHash: string, data: any) {
  // Use admin client to insert cache, preventing authenticated users from spoofing insights via API
  const { createClient: createAdminClient } = require('@supabase/supabase-js')
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  await adminClient.from('ai_insights_cache').insert({
    team_id: teamId,
    insight_type: insightType,
    context_hash: contextHash,
    structured_data: data
  })
}

function hashContext(contextObj: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(contextObj)).digest('hex')
}

async function checkRateLimit(teamId: string, insightType: string) {
  const supabase = await createClient()
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  
  const { data } = await supabase
    .from('ai_insights_cache')
    .select('id')
    .eq('team_id', teamId)
    .eq('insight_type', insightType)
    .gte('created_at', twoMinutesAgo)
    .limit(1)
    
  if (data && data.length > 0) {
    throw new Error('Rate limit exceeded: Please wait 2 minutes before refreshing insights again.')
  }
}

export async function generateTeamWeeklySummary(teamId: string, forceRefresh = false) {
  const tasksContext = await buildTeamTasksContext(teamId)
  const blockersContext = await buildBlockersContext(teamId)
  
  const context = { ...tasksContext, ...blockersContext }
  const hash = hashContext(context)
  
  if (!forceRefresh) {
    const cached = await getCachedInsight<any>(teamId, 'weekly_summary', hash)
    if (cached) return cached
  } else {
    await checkRateLimit(teamId, 'weekly_summary')
  }
  
  const model = getAIProvider()
  const { object } = await generateObject({
    model,
    schema: WeeklySummarySchema,
    prompt: `Analyze the following team data and provide a weekly summary.\nData:\n${JSON.stringify(context, null, 2)}`
  })
  
  await setCachedInsight(teamId, 'weekly_summary', hash, object).catch(console.error)
  return object
}

export async function generateAttentionInsights(teamId: string, forceRefresh = false) {
  const tasksContext = await buildTeamTasksContext(teamId)
  const blockersContext = await buildBlockersContext(teamId)
  
  const context = { ...tasksContext, ...blockersContext }
  const hash = hashContext(context)
  
  if (!forceRefresh) {
    const cached = await getCachedInsight<any>(teamId, 'attention', hash)
    if (cached) return cached
  } else {
    await checkRateLimit(teamId, 'attention')
  }
  
  const model = getAIProvider()
  const { object } = await generateObject({
    model,
    schema: AttentionSchema,
    prompt: `Based on the following tasks and blockers, identify what needs immediate attention. Focus on overdue/high priority tasks and critical blockers.\nData:\n${JSON.stringify(context, null, 2)}`
  })
  
  await setCachedInsight(teamId, 'attention', hash, object).catch(console.error)
  return object
}

export async function generateBlockerInsights(teamId: string, forceRefresh = false) {
  const context = await buildBlockersContext(teamId)
  const hash = hashContext(context)
  
  if (!forceRefresh) {
    const cached = await getCachedInsight<any>(teamId, 'blocker_insights', hash)
    if (cached) return cached
  } else {
    await checkRateLimit(teamId, 'blocker_insights')
  }
  
  const model = getAIProvider()
  const { object } = await generateObject({
    model,
    schema: BlockerInsightsSchema,
    prompt: `Analyze the following blocker data for themes, older blockers needing attention, and general recommendations.\nData:\n${JSON.stringify(context, null, 2)}`
  })
  
  await setCachedInsight(teamId, 'blocker_insights', hash, object).catch(console.error)
  return object
}

export async function generateCheckinSummary(teamId: string, forceRefresh = false) {
  const context = await buildCheckinsContext(teamId)
  const hash = hashContext(context)
  
  if (!forceRefresh) {
    const cached = await getCachedInsight<any>(teamId, 'checkin_summary', hash)
    if (cached) return cached
  } else {
    await checkRateLimit(teamId, 'checkin_summary')
  }
  
  const model = getAIProvider()
  const { object } = await generateObject({
    model,
    schema: CheckinSummarySchema,
    prompt: `Synthesize the team's weekly check-ins into a cohesive summary. Respect data limitations if empty.\nData:\n${JSON.stringify(context, null, 2)}`
  })
  
  await setCachedInsight(teamId, 'checkin_summary', hash, object).catch(console.error)
  return object
}

// Project Health Explanation does not need cache since it's lightweight and context changes often, 
// or we can cache it. For now we just call it directly.
export async function explainProjectHealth(projectId: string, deterministicStatus: string) {
  const context = await buildProjectHealthContext(projectId)
  
  const model = getAIProvider()
  const { object } = await generateObject({
    model,
    schema: ProjectHealthExplanationSchema,
    prompt: `The project has been deterministically marked as "${deterministicStatus}". Look at the project data and explain WHY it might have this status. Ground your explanation purely in this data (e.g., number of open tasks). DO NOT contradict the status.\nData:\n${JSON.stringify(context, null, 2)}`
  })
  
  return object
}
