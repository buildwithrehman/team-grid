import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { MemberWorkload } from '@/lib/calculations/workload'

export function WorkloadSummary({ workload }: { workload: MemberWorkload[] }) {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'Light': return 'bg-green-100 text-green-800 border-green-200'
      case 'Moderate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Heavy': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col h-full lg:col-span-2">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {workload.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6">
            No team members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workload.map(w => (
              <div key={w.userId} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {w.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {w.fullName.split(' ')[0]}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{w.activeTaskCount} active tasks</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-3.5 ${getBadgeStyle(w.level)}`}>
                      {w.level}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
