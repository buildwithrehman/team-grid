'use client'

import { Bell, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { markAsRead, markAllAsRead } from '@/app/notifications/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell({ notifications }: { notifications: any[] }) {
  const unreadCount = notifications.filter(n => !n.read_at).length
  const recentNotifications = notifications.slice(0, 5)

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'critical_blocker_reported': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'blocker_resolved': return <CheckCircle2 className="w-4 h-4 text-blue-600" />
      default: return <PlayCircle className="w-4 h-4 text-indigo-600" />
    }
  }

  const getLink = (notification: any) => {
    if (notification.related_entity_type === 'project') return `/projects/${notification.related_entity_id}`
    if (notification.related_entity_type === 'blockers') return `/blockers`
    return '#'
  }

  return (
    <Popover>
      <PopoverTrigger className="relative p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 shadow-lg rounded-xl overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsRead()}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notif) => (
              <div 
                key={notif.id}
                className={`flex gap-3 p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.read_at ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
              >
                <div className="shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-medium truncate ${!notif.read_at ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notif.title}
                    </p>
                    {!notif.read_at && (
                      <span className="shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1.5 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex gap-2">
                      {!notif.read_at && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] font-medium text-gray-500 hover:text-indigo-600"
                        >
                          Mark read
                        </button>
                      )}
                      <Link 
                        href={getLink(notif)}
                        className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No new notifications.
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Link href="/notifications">
            <Button variant="ghost" className="w-full text-xs h-8 text-gray-600 hover:text-gray-900">
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
