'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateKeyResultValue } from '@/app/goals/actions'
import { CreateKeyResultModal } from './CreateKeyResultModal'
import { Target, CheckCircle2, Circle } from 'lucide-react'

export function KeyResultsList({ goalId, keyResults }: { goalId: string, keyResults: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpdate = async (krId: string, newValue: number) => {
    setLoading(krId)
    try {
      await updateKeyResultValue(krId, goalId, newValue)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {keyResults.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-[#111827]/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No key results yet</h3>
          <p className="text-sm text-gray-500 mb-6">Break your goal down into measurable metrics.</p>
          <CreateKeyResultModal goalId={goalId} />
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <CreateKeyResultModal goalId={goalId} />
          </div>
          <div className="grid gap-4">
            {keyResults.map(kr => {
              let progress = 0
              if (kr.target_value === 0) {
                progress = kr.current_value >= 0 ? 100 : 0
              } else if (kr.target_value > 0) {
                progress = Math.max(0, (kr.current_value / kr.target_value) * 100)
              } else {
                progress = kr.current_value <= kr.target_value ? 100 : (kr.current_value / kr.target_value) * 100
              }
              const displayProgress = Math.min(100, Math.round(progress))
              const isCompleted = kr.status === 'completed'

              return (
                <div key={kr.id} className={`bg-white dark:bg-[#111827] rounded-xl border p-5 transition-colors ${isCompleted ? 'border-green-200 dark:border-green-900/30' : 'border-gray-200 dark:border-gray-800'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <h4 className={`text-base font-semibold ${isCompleted ? 'text-gray-600 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {kr.title}
                        </h4>
                        {kr.description && (
                          <p className="text-sm text-gray-500 mt-1">{kr.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pl-8">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white">{kr.current_value}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-gray-500">{kr.target_value}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          disabled={loading === kr.id}
                          onClick={() => handleUpdate(kr.id, kr.current_value - 1)}
                        >
                          -
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          disabled={loading === kr.id}
                          onClick={() => handleUpdate(kr.id, kr.current_value + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-[#4F46E5]'}`}
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
