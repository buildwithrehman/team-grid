import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { markAsRead, markAllAsRead } from '@/app/notifications/actions'

export default async function NotificationsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filter = searchParams.filter || 'all'

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filter === 'unread') {
    query = query.is('read_at', null)
  }

  const { data: notifications } = await query

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'critical_blocker_reported': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'blocker_resolved': return <CheckCircle2 className="w-5 h-5 text-blue-600" />
      default: return <PlayCircle className="w-5 h-5 text-indigo-600" />
    }
  }

  const getLink = (notification: any) => {
    if (notification.related_entity_type === 'project') return `/projects/${notification.related_entity_id}`
    if (notification.related_entity_type === 'blockers') return `/blockers`
    return '#'
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Notifications
          </h1>
        </div>
        <form action={markAllAsRead}>
          <Button type="submit" variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            Mark all as read
          </Button>
        </form>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href="/notifications?filter=all">
          <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" className={filter === 'all' ? 'bg-indigo-600 text-white' : ''}>
            All
          </Button>
        </Link>
        <Link href="/notifications?filter=unread">
          <Button variant={filter === 'unread' ? 'default' : 'ghost'} size="sm" className={filter === 'unread' ? 'bg-indigo-600 text-white' : ''}>
            Unread
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                className={`flex gap-4 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!notif.read_at ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
              >
                <div className="shrink-0 mt-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-base font-semibold ${!notif.read_at ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notif.title}
                    </h3>
                    {!notif.read_at && <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shrink-0" />}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {notif.message}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-400 font-medium tracking-wide">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {!notif.read_at && (
                        <form action={async () => { 'use server'; await markAsRead(notif.id); }}>
                          <button type="submit" className="text-xs font-medium text-gray-500 hover:text-indigo-600">
                            Mark as read
                          </button>
                        </form>
                      )}
                      <Link href={getLink(notif)}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs px-3">
                          View details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No notifications</h3>
            <p className="text-gray-500 text-sm">You're all caught up! {filter === 'unread' ? 'No unread notifications right now.' : 'When you receive notifications, they will appear here.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
