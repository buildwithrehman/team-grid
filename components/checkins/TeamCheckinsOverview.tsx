'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function TeamCheckinsOverview({ members, checkins }: { members: any[], checkins: any[] }) {
  
  const getConfidenceColor = (level: number) => {
    if (level >= 4) return 'text-green-600 bg-green-100'
    if (level === 3) return 'text-blue-600 bg-blue-100'
    if (level <= 2) return 'text-orange-600 bg-orange-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-4">
      {members.map(member => {
        const checkin = checkins.find(c => c.user_id === member.user_id)
        
        return (
          <Card key={member.user_id} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {member.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{member.profiles?.full_name}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      {checkin?.status === 'submitted' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">Submitted</Badge>
                      ) : checkin?.status === 'draft' ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Draft</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]">Missing</Badge>
                      )}
                      
                      {checkin?.submitted_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(checkin.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {checkin?.status === 'submitted' && checkin.confidence_level && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getConfidenceColor(checkin.confidence_level)}`}>
                    {checkin.confidence_level}
                  </div>
                )}
              </div>

              {checkin?.status === 'submitted' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Accomplishments</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {checkin.accomplishments || 'None reported.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next Focus</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {checkin.next_week_focus || 'None reported.'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic mt-4">
                  Check-in not yet submitted.
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
