'use client'

import { useState } from 'react'
import { WebhooksList } from './WebhooksList'
import { IntegrationLogs } from './IntegrationLogs'

export function IntegrationsContainer({ teamId, integrations, logs, canManage }: { teamId: string, integrations: any[], logs: any[], canManage: boolean }) {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'logs'>('webhooks')

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`${
              activeTab === 'webhooks'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Integration Logs
          </button>
        </nav>
      </div>

      <div className="pt-4">
        {activeTab === 'webhooks' ? (
          <WebhooksList teamId={teamId} integrations={integrations} canManage={canManage} />
        ) : (
          <IntegrationLogs logs={logs} />
        )}
      </div>
    </div>
  )
}
