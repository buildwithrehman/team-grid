'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface ProjectHealthItem {
  id: string
  name: string
  status: 'healthy' | 'at_risk' | 'critical'
  reasons: string[]
}

export function ProjectHealthOverview({ projects }: { projects: ProjectHealthItem[] }) {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'at_risk': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Project Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
        {projects.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No active projects to monitor.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {projects.map(p => (
              <div key={p.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/projects/${p.id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-[#4F46E5] hover:underline">
                    {p.name}
                  </Link>
                  <Badge variant="outline" className={`capitalize text-[10px] px-1.5 py-0 h-4 ${getBadgeStyle(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {p.reasons.map((r, i) => (
                    <p key={i} className="text-xs text-gray-500 flex items-start gap-1">
                      <span className="text-gray-300 dark:text-gray-600">•</span> {r}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
