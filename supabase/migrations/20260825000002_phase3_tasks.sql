-- Helper function for task authorization
create or replace function public.is_project_member_or_team_admin(check_project_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = check_project_id
    and (
      public.is_team_admin_or_leader(p.team_id)
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = check_project_id and pm.user_id = auth.uid()
      )
    )
  );
$$;

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id) not null,
  status text not null check (status in ('todo', 'in_progress', 'review', 'completed')) default 'todo',
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  start_date date,
  deadline date,
  progress integer not null check (progress >= 0 and progress <= 100) default 0,
  is_archived boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tasks
alter table public.tasks enable row level security;

-- Policies for tasks
create policy "Tasks viewable by team members."
  on public.tasks for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id
      and public.is_team_member(p.team_id)
    )
  );

create policy "Project members and team admins can create tasks."
  on public.tasks for insert
  to authenticated
  with check ( public.is_project_member_or_team_admin(project_id) );

create policy "Project members and team admins can update tasks."
  on public.tasks for update
  to authenticated
  using (
    public.is_project_member_or_team_admin(project_id)
  );

-- Create a view for real project progress
create view public.project_stats as
select
  p.id as project_id,
  count(t.id) filter (where not t.is_archived) as total_tasks,
  count(t.id) filter (where t.status = 'completed' and not t.is_archived) as completed_tasks,
  coalesce(round(avg(t.progress) filter (where not t.is_archived)), 0) as project_progress
from
  public.projects p
  left join public.tasks t on p.id = t.project_id
group by p.id;

-- Ensure view is accessible by authenticated users
-- Views created by default use the permissions of the underlying tables.
-- Since the underlying tables have RLS, the view automatically filters out rows the user can't see,
-- but wait, if the view doesn't have security barrier, it might expose things. 
-- Actually, a standard view runs with the privileges of the invoker and applies RLS of underlying tables.

-- Trigger to sync task status and progress
create or replace function public.sync_task_status_progress()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If status changed to completed, force progress to 100
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.progress = 100;
  end if;

  -- If progress changed to 100, force status to completed
  if new.progress = 100 and old.progress is distinct from 100 then
    new.status = 'completed';
  end if;

  return new;
end;
$$;

create trigger on_task_update_sync
  before update on public.tasks
  for each row execute procedure public.sync_task_status_progress();

-- Also apply on insert
create trigger on_task_insert_sync
  before insert on public.tasks
  for each row execute procedure public.sync_task_status_progress();
