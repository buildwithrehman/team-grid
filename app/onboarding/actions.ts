'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  // Use the RPC we created
  const { data, error } = await supabase.rpc('create_team', {
    team_name: name,
    team_description: description,
  })

  if (error) {
    return redirect('/onboarding?error=' + encodeURIComponent(error.message))
  }

  // Once team is created, redirect to dashboard or project home
  redirect('/dashboard')
}
