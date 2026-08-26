-- ACTIVITY EVENTS TABLE
create table public.activity_events (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.activity_events enable row level security;

-- Users can view activity events for teams they belong to
create policy "Team members can view activity"
  on public.activity_events for select
  to authenticated
  using (public.is_team_member(team_id));

-- Users can insert activity if they are part of the team and acting as themselves
create policy "Team members can insert activity"
  on public.activity_events for insert
  to authenticated
  with check (
    actor_id = auth.uid() and 
    public.is_team_member(team_id)
  );

-- Indexes for performance
create index idx_activity_team_id on public.activity_events(team_id);
create index idx_activity_created_at on public.activity_events(created_at desc);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  related_entity_type text not null,
  related_entity_id uuid not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- Users can select their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid());

-- We allow internal insertion via server actions/triggers, but for RLS completeness:
create policy "Users can receive notifications"
  on public.notifications for insert
  to authenticated
  with check (public.is_team_member(team_id));

-- Indexes for performance
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_created_at on public.notifications(created_at desc);

