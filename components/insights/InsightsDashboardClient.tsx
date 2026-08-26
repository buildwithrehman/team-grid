'use client'

import { useEffect, useState } from 'react'
import { fetchAIInsights } from '@/app/insights/actions'
import { Button } from '@/components/ui/button'
import { RefreshCw, Sparkles, AlertTriangle, Info, CheckCircle2, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function InsightsDashboardClient({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true)
    else setLoading(true)
    
    setError(null)
    
    try {
      const res = await fetchAIInsights(teamId, forceRefresh)
      if (res.error) {
        setError(res.error)
      } else {
        setData(res)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [teamId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Generating insights...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg">AI Generation Failed</h3>
          <p className="mt-1">{error}</p>
          <Button onClick={() => loadData(true)} variant="outline" className="mt-4 bg-white border-red-200 hover:bg-red-50">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => loadData(true)} 
          disabled={refreshing}
          variant="outline"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-900/20"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weekly Summary Card */}
        {data.weeklySummary && (
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Weekly Summary
                </h2>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                </Badge>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">{data.weeklySummary.summary}</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Accomplishments
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {data.weeklySummary.majorAccomplishments.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <ListTodo className="w-4 h-4 text-indigo-500" /> Priorities for Next Week
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {data.weeklySummary.suggestedPriorities.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attention Card */}
        {data.attention && (
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  What Needs Attention?
                </h2>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                </Badge>
              </div>
              
              {data.attention.criticalIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500">No critical issues identified.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.attention.criticalIssues.map((issue: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{issue.title}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{issue.reasoning}</p>
                      <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 border-l-2 border-l-amber-500">
                        <span className="font-semibold block mb-1">Actionable Advice:</span>
                        {issue.actionableAdvice}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check-in Summary */}
        {data.checkinSummary && (
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Check-in Insights
                </h2>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{data.checkinSummary.summary}</p>
              
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {data.checkinSummary.concerns.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Reported Concerns</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {data.checkinSummary.concerns.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Blocker Insights */}
        {data.blockerInsights && (
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Blocker Landscape
                </h2>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{data.blockerInsights.summary}</p>
              
              <div className="space-y-3">
                {data.blockerInsights.commonThemes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.blockerInsights.commonThemes.map((theme: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
                
                {data.blockerInsights.suggestedActions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Suggested Actions</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {data.blockerInsights.suggestedActions.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
