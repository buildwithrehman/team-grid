-- MILESTONES TABLE
create table public.milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null check (status in ('upcoming', 'in_progress', 'completed', 'missed')) default 'upcoming',
  target_date date,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on milestones
alter table public.milestones enable row level security;

-- Policies for milestones (Inherits from projects)
create policy "Milestones viewable by project members/team admins."
  on public.milestones for select
  to authenticated
  using (
    public.is_project_member_or_team_admin(project_id)
  );

create policy "Milestones manageable by project admins/leaders/owners."
  on public.milestones for all
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
      and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
    )
  );

-- GOALS TABLE
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  goal_type text not null check (goal_type in ('personal', 'team', 'project')),
  owner_id uuid references public.profiles(id) not null,
  team_id uuid references public.teams(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  start_date date,
  target_date date,
  status text not null check (status in ('not_started', 'in_progress', 'completed', 'at_risk', 'cancelled')) default 'not_started',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints based on type
  constraint team_goal_needs_team check (goal_type != 'team' or team_id is not null),
  constraint project_goal_needs_project check (goal_type != 'project' or project_id is not null)
);

-- Enable RLS on goals
alter table public.goals enable row level security;

-- Policies for goals
create policy "Goals select policy"
  on public.goals for select
  to authenticated
  using (
    (owner_id = auth.uid()) -- Owner can always see their goals
    or
    (goal_type = 'team' and team_id is not null and public.is_team_member(team_id))
    or
    (goal_type = 'project' and project_id is not null and exists (
      select 1 from public.projects p where p.id = goals.project_id and public.is_team_member(p.team_id)
    ))
  );

create policy "Goals insert policy"
  on public.goals for insert
  to authenticated
  with check (
    -- user must be owner to create for themselves, or authorized role in team/project
    owner_id = auth.uid()
    and (
      (goal_type = 'personal')
      or
      (goal_type = 'team' and public.is_team_admin_or_leader(team_id))
      or
      (goal_type = 'project' and exists (
        select 1 from public.projects p where p.id = project_id and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
      ))
    )
  );

create policy "Goals update/delete policy"
  on public.goals for update
  to authenticated
  using (
    owner_id = auth.uid()
    or
    (goal_type = 'team' and public.is_team_admin_or_leader(team_id))
    or
    (goal_type = 'project' and exists (
      select 1 from public.projects p where p.id = project_id and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
    ))
  );

create policy "Goals delete policy"
  on public.goals for delete
  to authenticated
  using (
    owner_id = auth.uid()
    or
    (goal_type = 'team' and public.is_team_admin_or_leader(team_id))
    or
    (goal_type = 'project' and exists (
      select 1 from public.projects p where p.id = project_id and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
    ))
  );

-- KEY RESULTS TABLE
create table public.key_results (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  title text not null,
  description text,
  current_value numeric not null default 0,
  target_value numeric not null,
  status text not null check (status in ('active', 'completed', 'cancelled')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- ensure target value is not exactly 0 to avoid division by zero errors during naive calc, 
  -- or handle gracefully in views. We will handle in views.
  constraint valid_target check (target_value != 0 or current_value >= 0)
);

-- Enable RLS on key results
alter table public.key_results enable row level security;

-- Helper for key result auth
create or replace function public.can_access_goal(check_goal_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.goals g
    where g.id = check_goal_id
    and (
      g.owner_id = auth.uid()
      or (g.goal_type = 'team' and public.is_team_member(g.team_id))
      or (g.goal_type = 'project' and exists (
        select 1 from public.projects p where p.id = g.project_id and public.is_team_member(p.team_id)
      ))
    )
  );
$$;

create or replace function public.can_edit_goal(check_goal_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.goals g
    where g.id = check_goal_id
    and (
      g.owner_id = auth.uid()
      or (g.goal_type = 'team' and public.is_team_admin_or_leader(g.team_id))
      or (g.goal_type = 'project' and exists (
        select 1 from public.projects p where p.id = g.project_id and (public.is_team_admin_or_leader(p.team_id) or p.owner_id = auth.uid())
      ))
    )
  );
$$;

create policy "KR Select" on public.key_results for select using (public.can_access_goal(goal_id));
create policy "KR All" on public.key_results for all using (public.can_edit_goal(goal_id));

-- Trigger to auto-complete KR if current >= target
create or replace function public.sync_kr_status()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status != 'cancelled' then
    if new.target_value > 0 and new.current_value >= new.target_value then
      new.status = 'completed';
    elsif new.target_value < 0 and new.current_value <= new.target_value then
      new.status = 'completed';
    elsif new.target_value = 0 and new.current_value >= 0 then
      new.status = 'completed';
    elsif new.status = 'completed' then
      -- If it was manually completed but doesn't meet target, we leave it completed.
    else
      new.status = 'active';
    end if;
  end if;
  return new;
end;
$$;

create trigger on_kr_update_sync
  before insert or update on public.key_results
  for each row execute procedure public.sync_kr_status();

-- GOAL STATS VIEW
create view public.goal_stats as
select
  g.id as goal_id,
  count(kr.id) filter (where kr.status != 'cancelled') as total_krs,
  count(kr.id) filter (where kr.status = 'completed') as completed_krs,
  coalesce(
    round(
      avg(
        least(
          100,
          case 
            when kr.target_value = 0 then (case when kr.current_value >= 0 then 100 else 0 end)
            when kr.target_value > 0 then (greatest(0, kr.current_value) / kr.target_value) * 100
            when kr.target_value < 0 then (case when kr.current_value <= kr.target_value then 100 else (kr.current_value / kr.target_value)*100 end)
          end
        )
      ) filter (where kr.status != 'cancelled')
    ), 0
  ) as goal_progress
from
  public.goals g
  left join public.key_results kr on g.id = kr.goal_id
group by g.id;
