'use client'

import { MetricCard } from '@/components/dashboard/MetricCard'
import { Briefcase, AlertTriangle, CheckSquare, Clock } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ['#E5E7EB', '#60A5FA', '#FBBF24', '#10B981'] // Todo, In Progress, In Review, Completed
const BAR_COLORS = { low: '#6B7280', medium: '#3B82F6', high: '#F59E0B', critical: '#EF4444' }

export function ProjectAnalytics({ tasks, blockers, deadlines }: { tasks: any[], blockers: any[], deadlines: number }) {
  
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const openBlockers = blockers.filter(b => b.status === 'open').length

  // Task Status Distribution
  const statusCounts = { todo: 0, in_progress: 0, in_review: 0, completed: 0 }
  tasks.forEach(t => {
    if (statusCounts[t.status as keyof typeof statusCounts] !== undefined) {
      statusCounts[t.status as keyof typeof statusCounts]++
    }
  })
  
  const statusData = [
    { name: 'To Do', value: statusCounts.todo },
    { name: 'In Progress', value: statusCounts.in_progress },
    { name: 'In Review', value: statusCounts.in_review },
    { name: 'Completed', value: statusCounts.completed },
  ].filter(d => d.value > 0)

  // Task Priority Distribution
  const priorityCounts = { low: 0, medium: 0, high: 0, critical: 0 }
  tasks.forEach(t => {
    if (priorityCounts[t.priority as keyof typeof priorityCounts] !== undefined) {
      priorityCounts[t.priority as keyof typeof priorityCounts]++
    }
  })

  const priorityData = [
    { name: 'Low', count: priorityCounts.low, fill: BAR_COLORS.low },
    { name: 'Medium', count: priorityCounts.medium, fill: BAR_COLORS.medium },
    { name: 'High', count: priorityCounts.high, fill: BAR_COLORS.high },
    { name: 'Critical', count: priorityCounts.critical, fill: BAR_COLORS.critical },
  ]

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Insights</h2>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Real-time Data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks"
          value={totalTasks.toString()}
          icon={Briefcase}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <MetricCard
          title="Completed Tasks"
          value={completedTasks.toString()}
          icon={CheckSquare}
          colorClass="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <MetricCard
          title="Open Blockers"
          value={openBlockers.toString()}
          icon={AlertTriangle}
          colorClass={openBlockers > 0 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={deadlines.toString()}
          subtitle="Next 14 days"
          icon={Clock}
          colorClass={deadlines > 3 ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Task Status Distribution</h3>
          {statusData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-500">No tasks created yet</div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Task Priority Distribution</h3>
          {totalTasks > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-500">No tasks created yet</div>
          )}
        </div>

      </div>
    </div>
  )
}
