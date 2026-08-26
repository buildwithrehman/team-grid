'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Webhook, X, Shield, Info } from 'lucide-react'
import { createWebhook, updateWebhook, deleteWebhook } from '@/app/integrations/actions'

const AVAILABLE_EVENTS = [
  { id: 'task_created', label: 'Task Created' },
  { id: 'task_assigned', label: 'Task Assigned' },
  { id: 'task_status_changed', label: 'Task Status Changed' },
  { id: 'blocker_created', label: 'Blocker Created' },
  { id: 'blocker_resolved', label: 'Blocker Resolved' },
  { id: 'checkin_submitted', label: 'Check-in Submitted' }
]

export function WebhookModal({ teamId, integration, onClose }: { teamId: string, integration?: any, onClose: () => void }) {
  const [url, setUrl] = useState(integration?.url || '')
  const [status, setStatus] = useState(integration?.status || 'active')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(integration?.subscribed_events || ['*'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const isAllEvents = selectedEvents.includes('*')

  const toggleEvent = (eventId: string) => {
    if (isAllEvents) {
      setSelectedEvents([eventId])
      return
    }
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter(e => e !== eventId))
    } else {
      setSelectedEvents([...selectedEvents, eventId])
    }
  }

  const toggleAll = () => {
    if (isAllEvents) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(['*'])
    }
  }

  const handleSave = async () => {
    try {
      if (!url) throw new Error("URL is required")
      if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
        throw new Error("URL must use https://")
      }
      
      setLoading(true)
      setError(null)
      
      if (integration) {
        await updateWebhook(integration.id, url, selectedEvents, status)
        onClose()
      } else {
        const result = await createWebhook(teamId, url, selectedEvents)
        setNewSecret(result.secret)
        // Keep modal open to show secret
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!integration) return
    if (confirm("Are you sure you want to delete this integration? This cannot be undone.")) {
      try {
        setLoading(true)
        await deleteWebhook(integration.id)
        onClose()
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }
  }

  if (newSecret) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="p-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Webhook Created!</h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              Please copy your unique HMAC secret key now. You won't be able to see it again.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg flex items-center justify-between">
              <code className="text-sm font-mono break-all text-gray-800 dark:text-gray-200">{newSecret}</code>
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">I have copied my secret</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-600" />
            {integration ? 'Edit Webhook' : 'Add Webhook'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Payload URL</Label>
            <Input 
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/..."
              className="font-mono text-sm"
            />
          </div>

          {integration && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus:ring-gray-300"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="space-y-3">
            <Label>Which events would you like to trigger this webhook?</Label>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3 max-h-48 overflow-y-auto">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="all-events"
                  checked={isAllEvents}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="all-events" className="text-sm font-medium text-gray-900 dark:text-gray-100">Send me everything</label>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 my-2 pt-2 space-y-2">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.id} className="flex items-center space-x-2 pl-6">
                    <input 
                      type="checkbox" 
                      id={`event-${event.id}`}
                      checked={isAllEvents || selectedEvents.includes(event.id)}
                      disabled={isAllEvents}
                      onChange={() => toggleEvent(event.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                    />
                    <label htmlFor={`event-${event.id}`} className={`text-sm ${isAllEvents ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {event.label} <span className="text-xs text-gray-400 font-mono ml-1">({event.id})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/20 flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold mb-1">Security Note</p>
              <p>Team Grid will send a POST request to this URL. The payload will be signed using HMAC-SHA256. The signature will be included in the <code>x-teamgrid-signature</code> header.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] flex justify-between items-center rounded-b-xl">
          {integration ? (
            <Button variant="ghost" onClick={handleDelete} disabled={loading} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Delete
            </Button>
          ) : (
            <div></div> // spacer
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : integration ? 'Update Webhook' : 'Create Webhook'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
