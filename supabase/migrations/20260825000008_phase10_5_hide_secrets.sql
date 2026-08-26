-- Create a secure table for secrets that has no SELECT policies for authenticated users
create table public.integration_secrets (
  integration_id uuid references public.team_integrations(id) on delete cascade primary key,
  secret text not null
);

-- Enable RLS but add NO policies for 'select', meaning the API can never read from this table
alter table public.integration_secrets enable row level security;

-- Allow insertion by team admins during creation
create policy "Admins and leaders can insert secrets"
  on public.integration_secrets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_integrations
      where id = integration_id and public.is_team_admin_or_leader(team_id)
    )
  );

-- Migrate existing secrets
insert into public.integration_secrets (integration_id, secret)
select id, secret from public.team_integrations;

-- Remove the secret column from team_integrations so it's impossible to query
alter table public.team_integrations drop column secret;
