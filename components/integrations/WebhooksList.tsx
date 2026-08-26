'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WebhookModal } from './WebhookModal'
import { PlusCircle, Webhook, Settings, Copy, Check } from 'lucide-react'

export function WebhooksList({ teamId, integrations, canManage }: { teamId: string, integrations: any[], canManage: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<any>(null)

  const maskUrl = (url: string) => {
    if (url.length < 20) return url
    return url.substring(0, 15) + '...' + url.substring(url.length - 5)
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditingIntegration(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Webhook
          </Button>
        </div>
      )}

      {integrations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <Webhook className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No integrations configured</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a generic webhook to dispatch events to n8n or other tools.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider / URL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#111827] divide-y divide-gray-200 dark:divide-gray-800">
              {integrations.map((intg) => (
                <tr key={intg.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center">
                        <Webhook className="h-4 w-4" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{intg.provider}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]" title={intg.url}>{maskUrl(intg.url)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={intg.status === 'active' ? 'secondary' : 'outline'} className={intg.status === 'active' ? 'bg-green-100 text-green-800 border-transparent' : intg.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                      {intg.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {intg.subscribed_events.includes('*') ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">All Events</span>
                      ) : (
                        intg.subscribed_events.map((event: string) => (
                          <span key={event} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            {event}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingIntegration(intg); setIsModalOpen(true); }}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <WebhookModal
          teamId={teamId}
          integration={editingIntegration}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
