'use client'

import { updateTaskStatus } from '@/app/tasks/actions'
import { Badge } from '@/components/ui/badge'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'review', label: 'Review', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50 dark:bg-green-900/20' }
]

export function KanbanBoard({ tasks, projectId, members }: { tasks: any[], projectId: string, members: any[] }) {
  
  // For Phase 3, we implement a simple native drag and drop to avoid heavy dependencies
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // required to allow drop
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    
    // Find task to avoid unnecessary updates
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== status) {
      await updateTaskStatus(taskId, projectId, status)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium': return 'text-blue-700 bg-blue-100 border-blue-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        
        return (
          <div 
            key={col.id} 
            className={`flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827]/50 min-h-[500px] overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`p-4 border-b border-gray-200 dark:border-gray-800 ${col.color} flex justify-between items-center`}>
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{col.label}</h3>
              <Badge variant="secondary" className="bg-white dark:bg-gray-800">{colTasks.length}</Badge>
            </div>
            
            <div className="p-3 flex flex-col gap-3 flex-1">
              {colTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 uppercase ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                    {task.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${task.progress === 100 ? 'bg-green-500' : 'bg-[#4F46E5]'}`} 
                        style={{ width: `${task.progress}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {task.assigned_to ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold" title={task.assignee?.full_name}>
                        {task.assignee?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] border border-dashed border-gray-300" title="Unassigned">
                        ?
                      </div>
                    )}
                    
                    {task.deadline && (
                      <span className="text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {colTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 text-sm">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
