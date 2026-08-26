'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KanbanSquare, List as ListIcon } from 'lucide-react'
import { CreateTaskModal } from './CreateTaskModal'
import { KanbanBoard } from './KanbanBoard'
import { TaskList } from './TaskList'

export function TasksContainer({ projectId, tasks, members, projectProgress }: { projectId: string, tasks: any[], members: any[], projectProgress: number }) {
  const [view, setView] = useState<'list' | 'kanban'>('list')

  return (
    <div className="space-y-6 mt-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Project Progress:</span>
            <div className="flex items-center gap-2 w-32">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#4F46E5] transition-all"
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#4F46E5]">{projectProgress}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md flex items-center transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md flex items-center transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              title="Kanban View"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
          </div>
          <CreateTaskModal projectId={projectId} members={members} />
        </div>
      </div>

      <div className="min-h-[400px]">
        {view === 'list' ? (
          <TaskList tasks={tasks} projectId={projectId} members={members} />
        ) : (
          <KanbanBoard tasks={tasks} projectId={projectId} members={members} />
        )}
      </div>
    </div>
  )
}
