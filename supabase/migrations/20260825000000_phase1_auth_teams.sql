-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users."
  on profiles for select
  to authenticated
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  to authenticated
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  to authenticated
  using ( auth.uid() = id );

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create teams table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create team_members table FIRST
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('admin', 'team_leader', 'team_member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, user_id)
);

-- Enable RLS on teams
alter table public.teams enable row level security;

create policy "Teams are viewable by their members."
  on teams for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create teams."
  on teams for insert
  to authenticated
  with check ( auth.uid() = created_by );

create policy "Team admins can update their teams."
  on teams for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

-- Enable RLS on team_members
alter table public.team_members enable row level security;

create or replace function public.is_team_member(check_team_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_admin(check_team_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = auth.uid() and role = 'admin'
  );
$$;

create policy "Team members viewable by other team members."
  on team_members for select
  to authenticated
  using ( public.is_team_member(team_id) );

create policy "Team admins can manage members."
  on team_members for all
  to authenticated
  using ( public.is_team_admin(team_id) );

create function public.create_team(team_name text, team_description text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_team_id uuid;
begin
  insert into public.teams (name, description, created_by)
  values (team_name, team_description, auth.uid())
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'admin');

  return new_team_id;
end;
$$;

-- Auto-confirm email for easy local dev/testing
create or replace function public.auto_confirm()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update auth.users set email_confirmed_at = now() where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created_confirm
  after insert on auth.users
  for each row execute procedure public.auto_confirm();
