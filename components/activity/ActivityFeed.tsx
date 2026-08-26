'use client'

import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, CheckCircle2, AlertCircle, RefreshCw, FolderArchive, Save, ClipboardList } from 'lucide-react'

export function ActivityFeed({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <ActivityFeedIcon type="none" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No activity yet</h3>
        <p className="text-sm">When your team starts working, events will appear here.</p>
      </div>
    )
  }

  return (
    <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 space-y-8 pb-4">
      {events.map((event, index) => {
        const actorName = event.profiles?.full_name?.split(' ')[0] || 'Someone'
        const meta = event.metadata || {}
        
        let actionText = 'performed an action'
        let entityName = meta.title || meta.name || 'an item'
        
        switch (event.event_type) {
          case 'project_created': actionText = 'created project'; break;
          case 'project_archived': actionText = 'archived project'; break;
          case 'task_created': actionText = 'created task'; break;
          case 'task_status_changed': 
            actionText = meta.new_status === 'completed' ? 'completed task' : `moved task to ${meta.new_status}`; 
            break;
          case 'blocker_created': actionText = 'reported blocker'; break;
          case 'blocker_resolved': actionText = 'resolved blocker'; break;
          case 'checkin_submitted': actionText = 'submitted weekly check-in'; entityName = ''; break;
        }

        return (
          <div key={event.id} className="relative pl-8">
            {/* Timeline node */}
            <div className="absolute -left-3.5 top-1">
              <div className="bg-white dark:bg-[#111827] rounded-full p-1 border border-gray-200 dark:border-gray-800">
                <ActivityFeedIcon type={event.event_type} />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
                {' '}
                <span className="text-gray-600 dark:text-gray-400">{actionText}</span>
                {' '}
                {entityName && <span className="font-medium text-gray-900 dark:text-gray-100">"{entityName}"</span>}
              </div>
              <span className="text-xs text-gray-400 mt-1 font-medium">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityFeedIcon({ type }: { type: string }) {
  switch (type) {
    case 'project_created':
    case 'task_created':
      return <PlusCircle className="w-4 h-4 text-indigo-600" />
    case 'task_status_changed':
    case 'blocker_resolved':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    case 'blocker_created':
      return <AlertCircle className="w-4 h-4 text-red-600" />
    case 'project_archived':
      return <FolderArchive className="w-4 h-4 text-orange-600" />
    case 'checkin_submitted':
      return <ClipboardList className="w-4 h-4 text-blue-600" />
    default:
      return <RefreshCw className="w-4 h-4 text-gray-400" />
  }
}
