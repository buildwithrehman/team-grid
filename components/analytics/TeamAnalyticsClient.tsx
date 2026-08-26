'use client'

import { MetricCard } from '@/components/dashboard/MetricCard'
import { Briefcase, AlertTriangle, CheckSquare, Activity } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function TeamAnalyticsClient({ data }: { data: any }) {
  const avgCheckinRate = data.checkinTrends.length > 0 
    ? Math.round(data.checkinTrends.reduce((acc: number, cur: any) => acc + cur.rate, 0) / data.checkinTrends.length) 
    : 0

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Projects"
          value={data.activeProjectCount.toString()}
          icon={Briefcase}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        />
        <MetricCard
          title="Open Blockers"
          value={data.openBlockerCount.toString()}
          icon={AlertTriangle}
          colorClass={data.openBlockerCount > 0 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"}
        />
        <MetricCard
          title="Total Tasks"
          value={data.totalTasks.toString()}
          subtitle={`${data.completedTasks} completed`}
          icon={CheckSquare}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <MetricCard
          title="Avg Check-in Rate"
          value={`${avgCheckinRate}%`}
          subtitle="Last 4 weeks"
          icon={Activity}
          colorClass={avgCheckinRate >= 80 ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : avgCheckinRate < 50 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Project Status Distribution */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Active Project Status</h3>
          {data.projectStatusData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.projectStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No active projects" />
          )}
        </div>

        {/* Check-in Consistency */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Check-in Consistency (Last 4 Weeks)</h3>
          {data.checkinTrends.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.checkinTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Submission Rate']}
                  />
                  <Bar dataKey="rate" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No check-ins in the last 4 weeks" />
          )}
        </div>

        {/* Blocker Trends */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Blocker Trends (Created vs Resolved)</h3>
          {data.blockerTrends.length > 0 && data.blockerTrends.some((b: any) => b.created > 0 || b.resolved > 0) ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.blockerTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Created" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No blockers reported in the last 4 weeks" />
          )}
        </div>

      </div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
