-- TEAM INTEGRATIONS TABLE
create table public.team_integrations (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  provider text not null default 'webhook',
  url text not null,
  status text not null default 'active', -- 'active', 'inactive', 'error'
  secret text not null,
  subscribed_events jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.team_integrations enable row level security;

-- Only Admins and Leaders can manage integrations
create policy "Admins and leaders can insert integrations"
  on public.team_integrations for insert
  to authenticated
  with check (public.is_team_admin_or_leader(team_id));

create policy "Admins and leaders can update integrations"
  on public.team_integrations for update
  to authenticated
  using (public.is_team_admin_or_leader(team_id));

create policy "Admins and leaders can delete integrations"
  on public.team_integrations for delete
  to authenticated
  using (public.is_team_admin_or_leader(team_id));

-- Any team member can view integrations (but secret should be masked by the application layer)
create policy "Team members can view integrations"
  on public.team_integrations for select
  to authenticated
  using (public.is_team_member(team_id));

create index idx_team_integrations_team on public.team_integrations(team_id);

-- INTEGRATION LOGS TABLE
create table public.integration_logs (
  id uuid default gen_random_uuid() primary key,
  integration_id uuid references public.team_integrations(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  event_type text not null,
  status text not null, -- 'success', 'failed', 'timeout'
  http_status integer,
  error_summary text,
  attempted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.integration_logs enable row level security;

-- Users can view logs for their team
create policy "Team members can view integration logs"
  on public.integration_logs for select
  to authenticated
  using (public.is_team_member(team_id));

-- Note: insertions happen via server actions (RLS bypassed) or matching team_id check
create policy "Team members can insert integration logs"
  on public.integration_logs for insert
  to authenticated
  with check (public.is_team_member(team_id));

create index idx_integration_logs_team on public.integration_logs(team_id);
create index idx_integration_logs_attempted_at on public.integration_logs(attempted_at desc);

