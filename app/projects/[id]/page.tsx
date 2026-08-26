import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Users, Archive, Settings, PlusCircle } from 'lucide-react'
import { TasksContainer } from '@/components/tasks/TasksContainer'
import { MilestonesList } from '@/components/milestones/MilestonesList'
import { ProjectAnalytics } from '@/components/analytics/ProjectAnalytics'
import { ProjectHealthAIExplanation } from '@/components/insights/ProjectHealthAIExplanation'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  // Fetch project details
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles (full_name, avatar_url),
      project_members (
        id,
        user_id,
        profiles (full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !project) {
    redirect('/projects')
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(full_name, avatar_url)`)
    .eq('project_id', id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  // Fetch project stats
  const { data: stats } = await supabase
    .from('project_stats')
    .select('*')
    .eq('project_id', id)
    .single()

  // Fetch milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', id)
    .order('target_date', { ascending: true })

  // Fetch blockers
  const { data: blockers } = await supabase
    .from('blockers')
    .select('*')
    .eq('related_project_id', id)

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-indigo-100 text-indigo-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-amber-100 text-amber-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isArchived = project.is_archived
  
  // Calculate upcoming deadlines (Next 14 days)
  const now = new Date()
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  
  let upcomingDeadlines = 0
  if (tasks) {
    upcomingDeadlines += tasks.filter(t => t.deadline && t.status !== 'completed' && new Date(t.deadline) <= fourteenDays).length
  }
  if (milestones) {
    upcomingDeadlines += milestones.filter(m => m.target_date && m.status !== 'completed' && new Date(m.target_date) <= fourteenDays).length
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link href="/projects" className="flex items-center hover:text-[#4F46E5] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-sm relative">
        {isArchived && (
          <div className="absolute top-0 left-0 w-full bg-amber-100 text-amber-800 text-center text-sm py-1 font-medium rounded-t-xl">
            This project is archived and read-only.
          </div>
        )}
        
        <div className={`flex flex-col sm:flex-row justify-between items-start gap-6 ${isArchived ? 'mt-4' : ''}`}>
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className={`capitalize ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={`capitalize ${getPriorityColor(project.priority)}`}>
                {project.priority} Priority
              </Badge>
              <span className="text-sm text-gray-500">
                Created on {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {project.description || 'No detailed description provided for this project.'}
            </p>
          </div>
          
          {!isArchived && (
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button variant="outline" className="w-full justify-start">
                <Edit className="w-4 h-4 mr-2" /> Edit Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" /> Members
              </Button>
              {/* Archive handled via form action */}
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <Archive className="w-4 h-4 mr-2" /> Archive
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Project Information</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="block text-gray-500 mb-1">Owner</span>
                <span className="font-medium">{project.profiles?.full_name || 'Unknown User'}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Start Date</span>
                <span className="font-medium">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Target Deadline</span>
                <span className="font-medium">{project.target_deadline ? new Date(project.target_deadline).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Last Updated</span>
                <span className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
              <Badge variant="secondary" className="rounded-full">{project.project_members?.length || 0}</Badge>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {project.project_members?.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                      {member.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium">{member.profiles?.full_name || 'User'}</span>
                  </div>
                  {member.user_id === project.owner_id && (
                    <Badge variant="outline" className="text-xs">Owner</Badge>
                  )}
                </div>
              ))}
            </div>
            
            {!isArchived && (
              <Button variant="ghost" className="w-full mt-4 text-[#4F46E5] hover:text-[#4338CA] hover:bg-indigo-50">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Member
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PHASE 9 Project Analytics */}
      <ProjectAnalytics 
        tasks={tasks || []} 
        blockers={blockers || []} 
        deadlines={upcomingDeadlines} 
      />

      {/* PHASE 11 Project Health AI */}
      <ProjectHealthAIExplanation 
        projectId={project.id} 
        deterministicStatus={project.status.replace('_', ' ')} 
      />

      {/* PHASE 4 Milestones Section */}
      <MilestonesList 
        projectId={project.id} 
        milestones={milestones || []} 
      />

      {/* PHASE 3 Tasks Section */}
      <TasksContainer 
        projectId={project.id} 
        tasks={tasks || []} 
        members={project.project_members || []}
        projectProgress={stats?.project_progress || 0}
      />
    </div>
  )
}
