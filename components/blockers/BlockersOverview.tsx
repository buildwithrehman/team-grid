'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { updateBlockerStatus } from '@/app/blockers/actions'

export function BlockersOverview({ blockers }: { blockers: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleResolve = async (id: string) => {
    setLoadingId(id)
    await updateBlockerStatus(id, 'resolved')
    setLoadingId(null)
  }

  const renderColumn = (title: string, status: string, items: any[]) => (
    <div className="bg-gray-50/50 dark:bg-gray-800/20 rounded-xl p-4 min-h-[500px] border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h3>
        <Badge variant="secondary" className="bg-white dark:bg-gray-800">{items.length}</Badge>
      </div>

      <div className="space-y-3">
        {items.map(blocker => (
          <div key={blocker.id} className="bg-white dark:bg-[#111827] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-2">
              <Badge variant="outline" className={`text-[10px] uppercase ${getSeverityBadge(blocker.severity)}`}>
                {blocker.severity}
              </Badge>
              {status !== 'resolved' && (
                <button 
                  onClick={() => handleResolve(blocker.id)}
                  disabled={loadingId === blocker.id}
                  className="text-xs font-medium text-gray-500 hover:text-green-600 transition-colors"
                >
                  Resolve
                </button>
              )}
              {status === 'resolved' && blocker.resolved_at && (
                <span className="text-[10px] text-gray-400">
                  {new Date(blocker.resolved_at).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{blocker.title}</h4>
            {blocker.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{blocker.description}</p>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px]">
                  {blocker.profiles?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {blocker.profiles?.full_name?.split(' ')[0]}
                </span>
              </div>
              
              {blocker.projects && (
                <span className="text-[10px] font-medium text-gray-500 max-w-[100px] truncate">
                  {blocker.projects.name}
                </span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            No blockers
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderColumn('Open', 'open', blockers.filter(b => b.status === 'open'))}
      {renderColumn('In Progress', 'in_progress', blockers.filter(b => b.status === 'in_progress'))}
      {renderColumn('Resolved', 'resolved', blockers.filter(b => b.status === 'resolved'))}
    </div>
  )
}
