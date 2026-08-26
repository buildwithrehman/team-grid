'use client'

import { MetricCard } from '@/components/dashboard/MetricCard'
import { Target, CheckCircle2, BookOpen } from 'lucide-react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts'

export function PersonalGrowthAnalytics({ targets, entries, skills }: { targets: any[], entries: any[], skills: any[] }) {
  
  const activeTargets = targets.filter(t => t.status === 'in_progress').length
  const completedTargets = targets.filter(t => t.status === 'achieved').length
  const totalEntries = entries.length

  // Skill Distribution
  const skillLevels = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
  skills.forEach(s => {
    if (skillLevels[s.proficiency_level as keyof typeof skillLevels] !== undefined) {
      skillLevels[s.proficiency_level as keyof typeof skillLevels]++
    }
  })

  const radarData = [
    { subject: 'Beginner', A: skillLevels.beginner, fullMark: Math.max(...Object.values(skillLevels), 5) },
    { subject: 'Intermediate', A: skillLevels.intermediate, fullMark: Math.max(...Object.values(skillLevels), 5) },
    { subject: 'Advanced', A: skillLevels.advanced, fullMark: Math.max(...Object.values(skillLevels), 5) },
    { subject: 'Expert', A: skillLevels.expert, fullMark: Math.max(...Object.values(skillLevels), 5) },
  ]

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Learning Insights</h2>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Private to you</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Active Targets"
          value={activeTargets.toString()}
          icon={Target}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <MetricCard
          title="Completed Targets"
          value={completedTargets.toString()}
          icon={CheckCircle2}
          colorClass="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <MetricCard
          title="Total Logged Entries"
          value={totalEntries.toString()}
          icon={BookOpen}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        />
      </div>

      <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">Skill Proficiency Distribution</h3>
        {skills.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#374151" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, radarData[0].fullMark]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-sm text-gray-500">Add skills to see your proficiency radar</div>
        )}
      </div>
    </div>
  )
}
