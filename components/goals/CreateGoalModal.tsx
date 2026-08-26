'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PlusCircle } from 'lucide-react'
import { createGoal } from '@/app/goals/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CreateGoalModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [goalType, setGoalType] = useState('personal')
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createGoal(formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Failed to create goal. Make sure to provide a valid team/project ID if required.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Goal
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" name="title" required placeholder="E.g., Launch Q3 Marketing Campaign" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} placeholder="Describe the goal's objective..." />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal_type">Goal Type</Label>
              <Select name="goal_type" value={goalType} onValueChange={(val) => setGoalType(val || 'personal')}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input id="target_date" name="target_date" type="date" />
            </div>
          </div>

          {goalType === 'team' && (
            <div className="space-y-2">
              <Label htmlFor="team_id">Team ID</Label>
              <Input id="team_id" name="team_id" required placeholder="Enter UUID for now..." />
            </div>
          )}

          {goalType === 'project' && (
            <div className="space-y-2">
              <Label htmlFor="project_id">Project ID</Label>
              <Input id="project_id" name="project_id" required placeholder="Enter UUID for now..." />
            </div>
          )}

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
