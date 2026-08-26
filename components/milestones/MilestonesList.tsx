'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateMilestoneStatus } from '@/app/milestones/actions'
import { CreateMilestoneModal } from './CreateMilestoneModal'
import { Flag, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export function MilestonesList({ projectId, milestones }: { projectId: string, milestones: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusChange = async (milestoneId: string, status: string) => {
    setLoading(milestoneId)
    try {
      await updateMilestoneStatus(milestoneId, projectId, status)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Flag className="w-6 h-6 text-indigo-600" /> Milestones
        </h2>
        <CreateMilestoneModal projectId={projectId} />
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
        {milestones.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">
            No milestones yet.
          </div>
        )}

        {milestones.map((m, i) => {
          const isOverdue = m.status !== 'completed' && m.target_date && new Date(m.target_date) < new Date()
          const isCompleted = m.status === 'completed'
          const isMissed = m.status === 'missed'

          return (
            <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0D12] bg-white dark:bg-[#0B0D12] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : isMissed ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : isOverdue ? (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                ) : (
                  <Circle className="w-5 h-5 text-indigo-500" />
                )}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={`
                    capitalize text-xs
                    ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${isMissed ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    ${m.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  `}>
                    {m.status.replace('_', ' ')}
                  </Badge>
                  {m.target_date && (
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                      {new Date(m.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h4 className={`text-base font-semibold mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {m.title}
                </h4>
                <p className="text-sm text-gray-500 mb-4">{m.description}</p>
                
                <div className="flex gap-2">
                  {!isCompleted && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={loading === m.id}
                      onClick={() => handleStatusChange(m.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {m.status === 'upcoming' && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      disabled={loading === m.id}
                      onClick={() => handleStatusChange(m.id, 'in_progress')}
                    >
                      Start
                    </Button>
                  )}
                  {isOverdue && !isMissed && !isCompleted && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={loading === m.id}
                      onClick={() => handleStatusChange(m.id, 'missed')}
                    >
                      Mark Missed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
