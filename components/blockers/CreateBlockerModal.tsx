'use client'

import { useState } from 'react'
import { createBlocker } from '@/app/blockers/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle } from 'lucide-react'

export function CreateBlockerModal({ teamId, projects }: { teamId: string, projects: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createBlocker(teamId, formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Failed to report blocker")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-red-600 hover:bg-red-700 text-white">
        <AlertCircle className="w-4 h-4" /> Report Blocker
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report a Blocker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="What is blocking you?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" placeholder="Provide more details..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <select 
              name="severity" 
              className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] text-sm"
              defaultValue="medium"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="related_project_id">Related Project (Optional)</Label>
            <select 
              name="related_project_id" 
              className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] text-sm"
            >
              <option value="">None</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? 'Reporting...' : 'Report Blocker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
