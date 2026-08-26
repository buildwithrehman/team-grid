import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  
  const params = await searchParams
  
  let query = supabase
    .from('projects')
    .select(`
      *,
      project_members(count),
      profiles(full_name, avatar_url)
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: projects, error } = await query

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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-500">Manage and track your team's initiatives.</p>
        </div>
        <CreateProjectModal />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <form>
            <Input 
              name="q"
              placeholder="Search projects..." 
              className="pl-9 bg-white dark:bg-[#111827]" 
              defaultValue={params.q}
            />
          </form>
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group block">
              <div className="p-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-[#4F46E5] group-hover:underline truncate pr-2">
                    {project.name}
                  </h3>
                  <Badge variant="secondary" className={`capitalize shrink-0 ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                  {project.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`capitalize text-xs ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {project.project_members[0].count}
                    </span>
                    <span>members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects found</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new project.</p>
          <div className="mt-6">
            <CreateProjectModal />
          </div>
        </div>
      )}
    </div>
  )
}
