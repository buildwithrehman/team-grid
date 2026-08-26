-- Create helper functions for roles
create or replace function public.is_team_admin_or_leader(check_team_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = auth.uid() and role in ('admin', 'team_leader')
  );
$$;

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) not null,
  status text not null check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')) default 'planning',
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  start_date date,
  target_deadline date,
  is_archived boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- Policies for projects
create policy "Projects are viewable by team members."
  on public.projects for select
  to authenticated
  using ( public.is_team_member(team_id) );

create policy "Admins and leaders can create projects."
  on public.projects for insert
  to authenticated
  with check ( public.is_team_admin_or_leader(team_id) );

create policy "Admins, leaders, and owners can update projects."
  on public.projects for update
  to authenticated
  using (
    public.is_team_admin_or_leader(team_id) or owner_id = auth.uid()
  );

-- Create project_members table
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

-- Enable RLS on project_members
alter table public.project_members enable row level security;

-- Policies for project_members
create policy "Project members viewable by team members."
  on public.project_members for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
      and public.is_team_member(p.team_id)
    )
  );

create policy "Admins, leaders, and project owners can manage project members."
  on public.project_members for all
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
      and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
    )
  );
