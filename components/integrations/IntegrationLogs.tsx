'use client'

import { Badge } from '@/components/ui/badge'
import { Activity, Clock, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function IntegrationLogs({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        <Activity className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No logs available</h3>
        <p className="mt-1 text-sm text-gray-500">When integrations run, their execution history will appear here.</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'timeout': return <Clock className="w-5 h-5 text-amber-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {logs.map((log) => (
          <li key={log.id} className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {getStatusIcon(log.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {log.team_integrations?.provider || 'Unknown'} Webhook
                    </p>
                    <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      {log.event_type}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>{log.team_integrations?.url ? new URL(log.team_integrations.url).hostname : 'Unknown endpoint'}</span>
                    <span>&bull;</span>
                    <span>{formatDistanceToNow(new Date(log.attempted_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm">
                {log.http_status && (
                  <Badge variant="secondary" className={`mr-4 ${log.http_status >= 200 && log.http_status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    HTTP {log.http_status}
                  </Badge>
                )}
                <span className={`capitalize font-medium ${log.status === 'success' ? 'text-green-600' : log.status === 'timeout' ? 'text-amber-600' : 'text-red-600'}`}>
                  {log.status}
                </span>
              </div>
            </div>
            
            {log.error_summary && (
              <div className="mt-3 ml-9 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">{log.error_summary}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
