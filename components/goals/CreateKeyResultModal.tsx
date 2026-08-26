'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle } from 'lucide-react'
import { createKeyResult } from '@/app/goals/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateKeyResultModal({ goalId }: { goalId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createKeyResult(goalId, formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Failed to create Key Result")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Key Result
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Key Result</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Metric Title</Label>
            <Input id="title" name="title" required placeholder="E.g., Reach 1,000 signups" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_value">Starting Value</Label>
              <Input id="current_value" name="current_value" type="number" defaultValue="0" step="any" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_value">Target Value</Label>
              <Input id="target_value" name="target_value" type="number" required step="any" />
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" disabled={loading}>
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
