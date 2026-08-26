import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Target, Award, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogLearningModal } from '@/components/learning/LogLearningModal'
import { CreateTargetModal } from '@/components/learning/CreateTargetModal'
import { AddSkillModal } from '@/components/learning/AddSkillModal'
import { PersonalGrowthAnalytics } from '@/components/analytics/PersonalGrowthAnalytics'

export default async function LearningDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Targets
  const { data: targets } = await supabase
    .from('learning_targets')
    .select('*')
    .eq('user_id', user.id)
    .order('target_date', { ascending: true })

  // Fetch Skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('*, skills(name, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch Learning Log
  const { data: entries } = await supabase
    .from('learning_entries')
    .select('*, projects(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activeTargets = targets?.filter(t => t.status !== 'completed' && t.status !== 'cancelled') || []
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'advanced': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" /> My Learning & Growth
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track your professional development, skills, and goals.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-indigo-600 self-center mr-4">Back to Dashboard</Link>
          <CreateTargetModal />
          <AddSkillModal />
          <LogLearningModal />
        </div>
      </div>

      <PersonalGrowthAnalytics 
        targets={targets || []} 
        entries={entries || []} 
        skills={userSkills || []} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SKILLS OVERVIEW */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" /> My Skills
              </CardTitle>
              <AddSkillModal />
            </CardHeader>
            <CardContent className="p-6">
              {userSkills?.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">No skills added yet. Add your current expertise!</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userSkills?.map(us => (
                    <div key={us.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{us.skills.name}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400">{us.skills.category}</span>
                        <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 h-4 ${getLevelColor(us.current_level)}`}>
                          {us.current_level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LEARNING LOG */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Recent Learning Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {entries?.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No learning logged recently.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {entries?.map(entry => (
                    <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{entry.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="capitalize">{entry.learning_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                          {entry.projects && (
                            <>
                              <span>•</span>
                              <span className="flex items-center text-indigo-600 gap-1">
                                <LinkIcon className="w-3 h-3" /> {entry.projects.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize w-fit bg-gray-50 dark:bg-gray-800">
                        {entry.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* LEARNING TARGETS */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" /> Targets
              </CardTitle>
              <CreateTargetModal />
            </CardHeader>
            <CardContent className="p-0">
              {activeTargets.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No active learning targets.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {activeTargets.map(target => (
                    <div key={target.id} className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{target.title}</h4>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className={`capitalize text-[10px] ${target.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}>
                          {target.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Due {target.target_date ? new Date(target.target_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
