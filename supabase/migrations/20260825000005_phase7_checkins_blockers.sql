-- WEEKLY CHECK-INS TABLE
create table public.weekly_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  week_start_date date not null,
  week_end_date date not null,
  status text not null check (status in ('draft', 'submitted')) default 'draft',
  accomplishments text,
  current_work text,
  next_week_focus text,
  learning_reflection text,
  confidence_level integer check (confidence_level >= 1 and confidence_level <= 5),
  additional_notes text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Prevent duplicate check-ins for the same user, team, and week
  constraint unique_weekly_checkin unique (user_id, team_id, week_start_date)
);

alter table public.weekly_checkins enable row level security;

-- Users can insert their own check-ins, but must belong to the team
create policy "Users can insert their own check-ins"
  on public.weekly_checkins for insert
  to authenticated
  with check (
    user_id = auth.uid() and 
    public.is_team_member(team_id)
  );

-- Users can update their own check-ins
create policy "Users can update their own check-ins"
  on public.weekly_checkins for update
  to authenticated
  using (user_id = auth.uid());

-- Check-ins are viewable by the user AND any verified team member (for transparency)
create policy "Team members can view check-ins"
  on public.weekly_checkins for select
  to authenticated
  using (
    public.is_team_member(team_id)
  );

-- BLOCKERS TABLE
create table public.blockers (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  reported_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  related_project_id uuid references public.projects(id) on delete set null,
  related_task_id uuid references public.tasks(id) on delete set null,
  check_in_id uuid references public.weekly_checkins(id) on delete set null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')) default 'medium',
  status text not null check (status in ('open', 'in_progress', 'resolved')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

alter table public.blockers enable row level security;

-- Anyone in the team can view blockers
create policy "Team members can view blockers"
  on public.blockers for select
  to authenticated
  using (public.is_team_member(team_id));

-- Anyone in the team can insert blockers
create policy "Team members can insert blockers"
  on public.blockers for insert
  to authenticated
  with check (public.is_team_member(team_id) and reported_by = auth.uid());

-- Anyone in the team can update blockers (collaborative resolution)
create policy "Team members can update blockers"
  on public.blockers for update
  to authenticated
  using (public.is_team_member(team_id));

-- TRIGGERS & FUNCTIONS
-- Ensure blockers relate to valid projects/tasks within the same team
create or replace function public.validate_blocker_links()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Validate project belongs to the team
  if new.related_project_id is not null then
    if not exists (
      select 1 from public.projects p
      where p.id = new.related_project_id
      and p.team_id = new.team_id
    ) then
      raise exception 'Blocker project link must belong to the same team';
    end if;
  end if;

  -- Validate task belongs to a project in the team
  if new.related_task_id is not null then
    if not exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = new.related_task_id
      and p.team_id = new.team_id
    ) then
      raise exception 'Blocker task link must belong to the same team';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_blocker_links
  before insert or update on public.blockers
  for each row execute procedure public.validate_blocker_links();

-- Trigger to auto-set resolved_at
create or replace function public.sync_blocker_resolved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and old.status != 'resolved' then
    new.resolved_at = timezone('utc'::text, now());
  elsif new.status != 'resolved' and old.status = 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

create trigger sync_blocker_resolved_at
  before update on public.blockers
  for each row execute procedure public.sync_blocker_resolved_at();
