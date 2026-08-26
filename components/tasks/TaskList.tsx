'use client'

import { updateTaskStatus } from '@/app/tasks/actions'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TaskList({ tasks, projectId, members }: { tasks: any[], projectId: string, members: any[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-[#111827]/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No tasks yet</h3>
        <p className="text-sm text-gray-500">Create a task to get started.</p>
      </div>
    )
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
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <TableCell className="font-medium">
                {task.title}
              </TableCell>
              <TableCell>
                <Select 
                  defaultValue={task.status} 
                  onValueChange={(val) => updateTaskStatus(task.id, projectId, val)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                      {task.assignee?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {task.assignee?.full_name?.split(' ')[0] || 'Unknown'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 w-24">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${task.progress === 100 ? 'bg-green-500' : 'bg-[#4F46E5]'}`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{task.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
