create table public.ai_insights_cache (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  insight_type text not null,
  context_hash text not null,
  structured_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_insights_cache enable row level security;

-- Users can view caches for their team
create policy "Team members can view ai cache"
  on public.ai_insights_cache for select
  to authenticated
  using (public.is_team_member(team_id));

-- Users can insert caches for their team
create policy "Team members can insert ai cache"
  on public.ai_insights_cache for insert
  to authenticated
  with check (public.is_team_member(team_id));

-- Unique constraint to easily UPSERT/replace cache if we wanted, or just clean up old ones
create index idx_ai_insights_cache_lookup on public.ai_insights_cache(team_id, insight_type, context_hash);
create index idx_ai_insights_cache_created_at on public.ai_insights_cache(created_at desc);

