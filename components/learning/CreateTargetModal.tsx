'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle } from 'lucide-react'
import { createLearningTarget } from '@/app/learning/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateTargetModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createLearningTarget(formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Failed to create target")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
        <PlusCircle className="mr-2 h-4 w-4" /> New Target
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Learning Target</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Target Goal</Label>
            <Input id="title" name="title" required placeholder="E.g., Complete System Design Course" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input id="target_date" name="target_date" type="date" required />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Save Target'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
