-- Production Performance Indexes for Foreign Keys & Frequent Queries

-- 1. Teams & Members
create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);

-- 2. Projects
create index if not exists idx_projects_team_id on public.projects(team_id);
create index if not exists idx_projects_owner_id on public.projects(owner_id);

-- 3. Tasks
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);

-- 4. Goals & Milestones
create index if not exists idx_goals_team_id on public.goals(team_id);
create index if not exists idx_milestones_project_id on public.milestones(project_id);

-- 5. Blockers & Checkins
create index if not exists idx_blockers_team_id on public.blockers(team_id);
create index if not exists idx_weekly_checkins_team_id on public.weekly_checkins(team_id);
create index if not exists idx_weekly_checkins_user_id on public.weekly_checkins(user_id);

-- 6. Learning & Skills
create index if not exists idx_learning_entries_user_id on public.learning_entries(user_id);
create index if not exists idx_user_skills_user_id on public.user_skills(user_id);

