'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CreateGoalModal } from './CreateGoalModal'

export function GoalsTabs({ goals, currentUserId }: { goals: any[], currentUserId: string }) {
  const [activeTab, setActiveTab] = useState<'my_goals' | 'team_goals' | 'project_goals'>('my_goals')

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'my_goals') return g.owner_id === currentUserId && g.goal_type === 'personal'
    if (activeTab === 'team_goals') return g.goal_type === 'team'
    if (activeTab === 'project_goals') return g.goal_type === 'project'
    return false
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'at_risk': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="flex gap-6">
          <button 
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my_goals' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('my_goals')}
          >
            My Goals
          </button>
          <button 
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'team_goals' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('team_goals')}
          >
            Team Goals
          </button>
          <button 
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'project_goals' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('project_goals')}
          >
            Project Goals
          </button>
        </div>
        
        <CreateGoalModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-[#111827] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No goals found</h3>
            <p className="text-sm text-gray-500">Create a new goal to start tracking progress.</p>
          </div>
        )}

        {filteredGoals.map(goal => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                  <Badge variant="outline" className={`${getStatusColor(goal.status)} capitalize border-none`}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                  {goal.target_date && (
                    <span className="text-xs text-gray-500 font-medium">
                      Due {new Date(goal.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                  {goal.title}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                  {goal.description || 'No description provided.'}
                </p>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500">Progress</span>
                    <span className="text-xs font-bold text-[#4F46E5]">{goal.stats.goal_progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-[#4F46E5] transition-all"
                      style={{ width: `${goal.stats.goal_progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                      {goal.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {goal.profiles?.full_name || 'Owner'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
