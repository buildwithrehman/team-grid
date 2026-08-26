'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveWeeklyCheckin } from '@/app/checkins/actions'
import { Save, Send } from 'lucide-react'

export function WeeklyCheckinForm({ teamId, existingData }: { teamId: string, existingData?: any }) {
  const [loading, setLoading] = useState(false)
  const [confidence, setConfidence] = useState(existingData?.confidence_level || 3)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSubmit: boolean) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('confidence_level', confidence.toString())

    try {
      await saveWeeklyCheckin(teamId, formData, isSubmit)
      alert(isSubmit ? "Check-in Submitted!" : "Draft Saved!")
    } catch (err) {
      console.error(err)
      alert("Failed to save check-in")
    } finally {
      setLoading(false)
    }
  }

  const isSubmitted = existingData?.status === 'submitted'

  return (
    <form className="space-y-8" onSubmit={(e) => handleSubmit(e, true)}>
      <div className="space-y-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Accomplishments</Label>
          <p className="text-sm text-gray-500">What did you complete this week?</p>
          <Textarea 
            name="accomplishments" 
            defaultValue={existingData?.accomplishments} 
            className="min-h-[100px]" 
            placeholder="E.g., Shipped the new login flow..." 
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Current Work</Label>
          <p className="text-sm text-gray-500">What are you currently working on?</p>
          <Textarea 
            name="current_work" 
            defaultValue={existingData?.current_work} 
            className="min-h-[100px]" 
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Next Week's Focus</Label>
          <p className="text-sm text-gray-500">What will you prioritize next week?</p>
          <Textarea 
            name="next_week_focus" 
            defaultValue={existingData?.next_week_focus} 
            className="min-h-[100px]" 
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Learning Reflection</Label>
          <p className="text-sm text-gray-500">What did you learn or improve on?</p>
          <Textarea 
            name="learning_reflection" 
            defaultValue={existingData?.learning_reflection} 
            className="min-h-[100px]" 
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Confidence Level</Label>
          <p className="text-sm text-gray-500">How confident do you feel about your current work? (1 = Very Low, 5 = Very High)</p>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setConfidence(num)}
                className={`w-12 h-12 rounded-lg font-bold text-lg transition-colors ${
                  confidence === num 
                    ? 'bg-[#4F46E5] text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={(e) => handleSubmit(e as any, false)}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" /> {isSubmitted ? 'Save Changes' : 'Save as Draft'}
        </Button>
        <Button 
          type="submit" 
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          disabled={loading}
        >
          <Send className="w-4 h-4 mr-2" /> {isSubmitted ? 'Update Submission' : 'Submit Check-in'}
        </Button>
      </div>
    </form>
  )
}
