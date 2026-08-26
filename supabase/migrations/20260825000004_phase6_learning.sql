-- SKILLS TABLE
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  category text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.skills enable row level security;

-- Global read access for authenticated users
create policy "Skills are viewable by everyone"
  on public.skills for select
  to authenticated
  using (true);

-- Authenticated users can insert new skills if they don't exist
create policy "Users can insert skills"
  on public.skills for insert
  to authenticated
  with check (true);


-- USER SKILLS TABLE
create table public.user_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  current_level text not null check (current_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  target_level text check (target_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent user from having duplicate skill records
  constraint unique_user_skill unique(user_id, skill_id)
);

alter table public.user_skills enable row level security;

create policy "Users manage own user_skills"
  on public.user_skills for all
  to authenticated
  using (user_id = auth.uid());


-- LEARNING ENTRIES TABLE
create table public.learning_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  learning_type text not null check (learning_type in ('course', 'tutorial', 'documentation', 'project_based', 'article', 'video', 'practice', 'other')),
  status text not null check (status in ('planned', 'in_progress', 'completed', 'paused')) default 'planned',
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.learning_entries enable row level security;

-- Strictly private to user
create policy "Users manage own learning entries"
  on public.learning_entries for all
  to authenticated
  using (user_id = auth.uid());


-- LEARNING ENTRY SKILLS TABLE (Join Table)
create table public.learning_entry_skills (
  learning_entry_id uuid references public.learning_entries(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  
  primary key (learning_entry_id, skill_id)
);

alter table public.learning_entry_skills enable row level security;

create policy "Users manage own learning entry skills"
  on public.learning_entry_skills for all
  to authenticated
  using (
    exists (
      select 1 from public.learning_entries le
      where le.id = learning_entry_skills.learning_entry_id
      and le.user_id = auth.uid()
    )
  );


-- LEARNING TARGETS TABLE
create table public.learning_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  related_skill_id uuid references public.skills(id) on delete set null,
  target_level text check (target_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  target_date date,
  status text not null check (status in ('planned', 'in_progress', 'completed', 'paused', 'cancelled')) default 'planned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.learning_targets enable row level security;

create policy "Users manage own learning targets"
  on public.learning_targets for all
  to authenticated
  using (user_id = auth.uid());


-- TRIGGER FOR PROJECT/TASK LINK VALIDATION
-- Ensure a user can only link a learning entry to a project/task they have access to.
create or replace function public.validate_learning_entry_links()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Validate project_id
  if new.project_id is not null then
    if not exists (
      select 1 from public.projects p
      where p.id = new.project_id
      and public.is_project_member_or_team_admin(p.id)
    ) then
      raise exception 'Unauthorized project link';
    end if;
  end if;

  -- Validate task_id
  if new.task_id is not null then
    if not exists (
      select 1 from public.tasks t
      where t.id = new.task_id
      and public.is_project_member_or_team_admin(t.project_id)
    ) then
      raise exception 'Unauthorized task link';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_learning_links
  before insert or update on public.learning_entries
  for each row execute procedure public.validate_learning_entry_links();
