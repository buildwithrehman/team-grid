'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, AlertCircle } from "lucide-react"
import { DeadlineItem } from '@/lib/calculations/deadlines'

export function UpcomingDeadlines({ items }: { items: DeadlineItem[] }) {
  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Upcoming Deadlines <span className="text-xs font-normal text-gray-400 ml-2">(Next 14 Days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No upcoming deadlines.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map(item => (
              <Link 
                key={item.id} 
                href={item.url}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="mt-0.5">
                  {item.isOverdue ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold ${item.isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.isOverdue ? 'Overdue: ' : ''}{item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-400">• {item.contextInfo}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
