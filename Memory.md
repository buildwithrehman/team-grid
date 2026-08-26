# Team Grid — Development Memory

## Current Phase

Phase 10 — Integrations & Automation (Completed)

## Completed Work

- (Phase 0) Initialized Next.js app with TypeScript, Tailwind CSS, and ESLint.
- (Phase 0) Set up `shadcn/ui` foundation (Lucide, Radix UI) with custom Tailwind config.
- (Phase 0) Created required folder structure (`app`, `components`, `lib`, etc.).
- (Phase 0) Installed Supabase packages (`@supabase/supabase-js`, `@supabase/ssr`).
- (Phase 0) Created Supabase utility clients for browser, server, and proxy middleware.
- (Phase 0) Configured font to `Inter` and set Design.md colors in `globals.css`.
- (Phase 0) Created `.env.local` and `.env.example` templates.
- (Phase 1) Used Google Stitch MCP to design Login, Sign-up, and Team Onboarding pages.
- (Phase 1) Created and applied Supabase DB migrations for `profiles`, `teams`, and `team_members`.
- (Phase 1) Configured Row Level Security (RLS) on all tables with infinite-recursion fixes.
- (Phase 1) Built UI and Next.js server actions for Login, Sign-up, Logout, and Onboarding.
- (Phase 1) Enforced auth protection via `proxy.ts` middleware.
- (Phase 2) Used Google Stitch MCP to generate Project List, Create Project Modal, and Project Detail pages.
- (Phase 2) Created and applied Supabase migrations for `projects` and `project_members`.
- (Phase 2) Configured RLS for `projects` and `project_members` utilizing `is_team_admin_or_leader`.
- (Phase 2) Built Phase 2 UI including Projects List (`/projects`), Project Detail (`/projects/[id]`), and Create Modal.
- (Phase 2) Implemented server actions for Create Project and Archive Project.
- (Phase 3) Used Google Stitch MCP to generate Task List View, Kanban Board, Create Task Modal, and Task Detail.
- (Phase 3) Created and applied Supabase migrations for `tasks` table and `project_stats` Postgres view.
- (Phase 3) Configured RLS on `tasks` leveraging `is_project_member_or_team_admin`.
- (Phase 3) Developed Postgres triggers (`sync_task_status_progress`) to keep status (`completed`) and progress (`100%`) strictly synchronized in the DB.
- (Phase 3) Built Phase 3 UI including `TasksContainer` for toggling between `TaskList` and `KanbanBoard`.
- (Phase 3) Implemented server actions for `createTask`, `updateTaskStatus`, `updateTaskProgress`, and `archiveTask`.
- (Phase 4) Used Google Stitch MCP to generate Goals Overview, Goal Detail, Create Goal Modal, Project Milestones, and Create Milestone Modal.
- (Phase 4) Created and applied Supabase migrations for `milestones`, `goals`, `key_results`, and `goal_stats` Postgres view.
- (Phase 4) Configured rigid RLS on `goals`: personal goals strictly isolated to owners, team/project goals accessible by appropriate team members.
- (Phase 4) Configured RLS on `key_results` to inherit from the parent Goal using DB helper functions.
- (Phase 4) Developed Postgres triggers (`sync_kr_status`) to auto-complete Key Results when `current_value >= target_value`.
- (Phase 4) Built Phase 4 UI and server actions handling creation, modification, and data fetching.
- (Phase 5) Used Google Stitch MCP to generate Main Team Dashboard view.
- (Phase 5) Implemented deterministic server-side `calculateProjectHealth` logic analyzing deadlines, tasks, and milestones.
- (Phase 5) Implemented `calculateUpcomingDeadlines` looking 14 days ahead, and `calculateTeamWorkload` mapping task volume to Light/Moderate/Heavy bands.
- (Phase 5) Built the complete `app/dashboard/page.tsx` pulling active metrics directly from the DB utilizing built-in RLS for security isolation.
- (Phase 6) Used Google Stitch MCP to generate "My Learning & Growth" dashboard, Create Target Modal, Add Skill Modal, and Log Learning Modal.
- (Phase 6) Implemented normalized learning schema: `skills`, `user_skills`, `learning_entries`, `learning_entry_skills`, and `learning_targets`.
- (Phase 6) Built strict RLS policies ensuring personal learning data is only accessible to the authenticated `user_id`.
- (Phase 6) Implemented DB trigger `validate_learning_entry_links` ensuring a user can only link a learning entry to a `project_id` or `task_id` if they are authorized to access that entity.
- (Phase 6) Built Phase 6 UI (`app/learning/page.tsx`) and Next.js server actions (`app/learning/actions.ts`) to drive the learning logic.
- (Phase 6.5) Conducted full RLS and Security audit proving Team Isolation and cross-team read/write blockades.
- (Phase 6.5) Conducted Calculation audit verifying DB triggers and TS algorithms function smoothly across 0-boundary and edge-cases.
- (Phase 6.5) Added global `app/loading.tsx` to handle Next.js App Router Suspense transitions and improve UX.
- (Phase 6.5) Patched dashboard calculation logic to correctly filter out tasks and milestones belonging to explicitly 'Archived' projects.
- (Phase 6.5) Ran comprehensive Node.js integration testing against the actual remote Supabase instance to prove RLS and Data cascades function exactly as designed.
- (Phase 7) Formulated Phase 7 Implementation Plan focusing on rigid unique constraints and team-transparent check-in visibility.
- (Phase 7) Generated My Weekly Check-in, Team Check-ins Overview, and Blockers Overview using Google Stitch.
- (Phase 7) Designed `weekly_checkins` and `blockers` schema. Leveraged composite `UNIQUE(user_id, team_id, week_start_date)` to prevent duplicates.
- (Phase 7) Integrated `is_team_member(team_id)` RLS policies to allow cross-team-member visibility for transparency while fully blocking uninvited snooping.
- (Phase 7) Engineered DB trigger `sync_blocker_resolved_at` to auto-stamp resolution time without manual client intervention.
- (Phase 7) Developed `lib/dateUtils.ts` algorithm enforcing strict Monday-Sunday UTC week boundaries.
- (Phase 7) Built Phase 7 UI (`app/checkins`, `app/blockers`) and Server Actions utilizing standard FormData processing.
- (Phase 7) Updated `app/dashboard/page.tsx` to surface Open/Critical blocker counts and Missing check-in counts efficiently.
- (Phase 8) Formulated Phase 8 Implementation Plan separating historical Activity Logs from actionable Notifications.
- (Phase 8) Designed `activity_events` and `notifications` DB schema with strong RLS ensuring strict cross-team and cross-user data isolation.
- (Phase 8) Used Google Stitch MCP to generate Notification Bell, Notifications Page, and Team Activity Feed.
- (Phase 8) Refactored existing Server Actions (`projects`, `tasks`, `blockers`, `checkins`) to automatically broadcast normalized events via `logActivity` and `createNotification`.
- (Phase 8) Added the global Notification dropdown to the unified Team Dashboard header.
- (Phase 9) Formulated Phase 9 Implementation Plan defining secure, privacy-aware analytics powered entirely by transactional data queries.
- (Phase 9) Installed and configured `recharts` for rich interactive visualizations.
- (Phase 9) Built `lib/calculations/analytics.ts` to compute blocker resolution trends, 4-week check-in consistency, and active project distributions.
- (Phase 9) Created `app/analytics/page.tsx` for Team-level analytics featuring Pie, Bar, and Line charts.
- (Phase 9) Created `ProjectAnalytics` component summarizing task priorities (Bar chart) and task statuses (Donut chart) directly in the Project Detail View.
- (Phase 9) Created `PersonalGrowthAnalytics` component visualizing skill proficiency (Radar chart) inside the Private Learning Dashboard.
- **(Phase 10) Formulated Phase 10 Implementation Plan prioritizing a secure, generic Webhook dispatcher.**
- **(Phase 10) Built `team_integrations` and `integration_logs` schema with hardened RLS and DB cascading.**
- **(Phase 10) Generated Integrations UI via Stitch MCP (Integrations Container, WebhooksList, WebhookModal, IntegrationLogs).**
- **(Phase 10) Implemented secure HMAC-SHA256 Payload Signatures (`x-teamgrid-signature`) to allow external verifiability (e.g., in n8n).**
- **(Phase 10) Attached `dispatchWebhooks` directly into the central `logActivity` event funnel.**
- **(Phase 10) Enforced a strict 3-second `AbortController` timeout for webhook dispatching to guarantee that bad endpoints never break core Team Grid assignments.**
- **(Phase 10.5) Conducted rigorous Phase 10.5 End-to-End Validation of the webhook system.**
- **(Phase 10.5) Discovered and patched a critical vulnerability where standard RLS allowed API extraction of `secret`. Moved secrets to `integration_secrets`.**
- **(Phase 10.5) Performed Final Security Hardening Audit of the `get_integration_secret` Postgres RPC:**
  - Added strict `set search_path = public` to prevent privilege escalation via malicious operators.
  - Revoked `EXECUTE` permissions from `PUBLIC`, `authenticated`, and `anon` roles.
  - Granted `EXECUTE` exclusively to `service_role`.
  - Refactored Next.js `dispatchWebhooks` logic to bypass RLS via `SUPABASE_SERVICE_ROLE_KEY` to retrieve the HMAC secret entirely out-of-band from the user session.
- **(Phase 10.5) Validated HMAC-SHA256 payload signature generation and 3-second network timeouts without impacting the main business flow.**
- **(Phase 11) Implemented secure, privacy-aware AI Insights using the Vercel AI SDK and Google Gemini (`@ai-sdk/google`).**
- **(Phase 11) Developed `lib/ai/context.ts` to strictly sanitize and map raw Supabase SQL rows into minimalist context windows, explicitly omitting IDs, secrets, and irrelevant metadata before transmittal.**
- **(Phase 11) Enforced rigorous Pre-Context Authorization in `app/insights/actions.ts`, ensuring the AI SDK is strictly bounded to the authenticated user's RLS environment.**
- **(Phase 11) Implemented Zod-validated structured outputs via `generateObject` for Weekly Summaries, What Needs Attention, Check-in Insights, and Blocker Themes.**
- **(Phase 11) Introduced `ai_insights_cache` table with strict RLS to cache context-hashed structured AI responses for 4 hours, drastically reducing LLM token costs and eliminating repetitive UI loading states.**
- **(Phase 11) Injected deterministic-grounded AI Explanations directly into the Project Health Analytics.**
- **(Phase 12) Executed a comprehensive Production Readiness Audit across Security, Performance, and Reliability.**
- **(Phase 12) Discovered and patched a critical API spoofing vulnerability in `ai_insights_cache` where authenticated users could inject fake AI insights. Insert permissions were fully revoked from clients, enforcing strictly backend-only insertions via Service Role.**
- **(Phase 12) Implemented AI rate limiting on `forceRefresh` (bypassing cache) by analyzing timestamps of recent insertions, preventing infinite loop token exhaustion.**
- **(Phase 12) Optimized the database for production by adding 12 targeted B-Tree indexes on core Foreign Keys (`team_id`, `project_id`, `user_id`) to eliminate sequential scans on dashboard load.**
- **(Phase 12) Created a heavily sanitized `.env.example` explicitly separating `PUBLIC` and `SERVER` keys to prevent accidental leaks of the Service Role or Gemini API keys.**

## Approved Stitch Designs

- Login Page (Desktop/Mobile)
- Sign-up Page (Desktop/Mobile)
- Team Onboarding Page (Desktop/Mobile)
- Projects List Page
- Create Project Modal
- Project Detail Page
- Project Task List View
- Kanban Board View
- Create Task Modal
- Task Detail Modal
- Goals Overview Page
- Goal Detail Page
- Project Milestones Section
- Main Team Dashboard
- My Learning Dashboard
- My Weekly Check-in
- Team Check-ins Overview
- Blockers Overview
- Notification Dropdown / Bell
- Notifications Page
- Team Activity Feed
- Team Analytics Overview
- Project Analytics Section
- Personal Growth Analytics
- **Integrations Settings Page**
- **Integration Logs**
- **Webhook Configuration Modal**

## Stitch Project Information

Project ID: 15192830507371185774
Screens: Login, Sign-up, Onboarding, Projects List, Create Project, Project Detail, Task List, Kanban, Create Task, Task Detail, Goals Overview, Goal Detail, Milestones, Dashboard, My Learning, Weekly Check-in, Team Check-ins, Blockers Overview, Notification Dropdown, Notifications Page, Team Activity Feed, Team Analytics Overview, Project Analytics Section, Personal Growth Analytics, Integrations Settings, Integration Logs, Webhook Configuration Modal

## Dependencies Added

- Phase 9: `recharts` for accessible charting.
- Phase 10: None (native Node `crypto` and `fetch` used).

## Technical Decisions

- **Auth Flow**: Users sign up -> Profile created via Postgres Trigger -> User lands on `/onboarding` to create first team -> Redirected to `/dashboard`.
- **RLS Recursion Fix**: Implemented `security definer` functions `is_team_member` and `is_team_admin` to prevent infinite recursion on `team_members` select policies.
- **Team Roles**: Roles (`admin`, `team_leader`, `team_member`) are team-specific, stored in `team_members`.
- **Project Visibility**: Projects are visible to all members of the team. 
- **Project Roles**: Only Admins, Team Leaders, or the explicit project `owner_id` can edit or archive the project.
- **Task Roles**: Task creation/editing is restricted to project members or team admins.
- **Progress Sync**: Status and progress are kept in bidirectional sync via Postgres database triggers (`sync_task_status_progress`).
- **Project Progress**: Real project progress is dynamically aggregated via a `project_stats` Postgres view.
- **Milestone Progress**: Milestone progress is manually managed via status changes (`upcoming`, `in_progress`, `completed`, `missed`) rather than linking tasks.
- **Goal Progress**: Goal Progress is dynamically calculated as the mathematical average of active Key Results via a `goal_stats` Postgres view.
- **Goal Status Automation**: Key results auto-complete upon reaching their target via the `sync_kr_status` Postgres trigger.
- **Project Health Evaluation**: Explicit deterministic rules are evaluated on the server rather than manually set. Projects become 'critical' or 'at_risk' if tasks/milestones are overdue or progress is stalling right before a deadline.
- **Learning Skill Progress Model**: Progress tracking for skills is manually updated via rigid enumerations (`beginner`, `intermediate`, `advanced`, `expert`) rather than arbitrary 0-100% inputs, preventing artificial precision. Learning Entries and Targets are tracked strictly via Status.
- **Global vs Personal Skills**: `skills` act as a global dictionary that any user can contribute to. `user_skills` securely isolates each user's specific skill levels to prevent duplication via a composite Unique Constraint on `(user_id, skill_id)`.
- **Dashboard Archiving Isolation**: Dashboard accurately filters out tasks and goals that belong to archived projects, removing them from workload and upcoming deadline queues.
- **Check-in Week Boundaries**: Enforced via a deterministic Typescript utility (`getCurrentWeekBoundaries`) that forces any incoming date into the strict Monday-to-Sunday UTC envelope.
- **Duplicate Prevention vs Upserting**: The `weekly_checkins` unique constraint prevents two separate check-in rows. The server action intelligently checks if the row exists and performs an `.update()` instead of `.insert()`, allowing users to continuously "Draft" their check-in throughout the week.
- **Blocker Resolutions**: Handled natively by a DB trigger `sync_blocker_resolved_at` that reacts to `status = 'resolved'`. This removes the burden from the Next.js client, making APIs universally consistent.
- **Real-Time vs Refresh Strategy (Phase 8)**: Given the serverless edge nature of Next.js Server Components, raw Supabase Realtime subscriptions significantly increase duplication and cleanup complexity. To ensure 100% UI stability, we opted for a rigorous "Server Actions + `revalidatePath`" refresh strategy, offloading the state resolution entirely to Postgres.
- **Activity vs Notification Architecture**: Kept as two separate distinct tables (`activity_events` and `notifications`) to decouple high-volume historical audit logs from actionable user-specific inbox alerts.
- **Analytics Architecture (Phase 9)**: Analytics are calculated on demand via Server Components rather than asynchronous materialized views. This ensures perfectly up-to-date information without complex CRON workers.
- **Analytics Historical Limitations (Phase 9)**: The early MVP schema for Projects and Tasks excluded a hard `completed_at` timestamp. Because `updated_at` floats whenever a record is tweaked, it cannot mathematically form a reliable completion trend line. Thus, historical charts were omitted for tasks/projects in favor of explicit blocker tracking (`resolved_at`) and Check-ins (`week_start_date`), ensuring charts are never misleading.
- **Generic Webhook Dispatcher (Phase 10)**: Implemented an asynchronous `fetch` layer utilizing Node `AbortController` (3s timeout) inside the `logActivity` pipeline. This architecture enables native connections to `n8n` and other systems without tightly coupling or blocking the main React thread.
- **Secret Management (Phase 10)**: Cryptographic Webhook Secrets (HMAC) are strictly filtered out of client `SELECT` requests to protect against exposure. Secrets are only shown once during creation.

## Database Changes

- Migrations applied to Supabase project `xtuwzfszrijoeqxtfkyy`.
- Created tables: `profiles`, `teams`, `team_members`, `projects`, `project_members`, `tasks`, `milestones`, `goals`, `key_results`, `skills`, `user_skills`, `learning_entries`, `learning_entry_skills`, `learning_targets`, `weekly_checkins`, `blockers`, `activity_events`, `notifications`, `team_integrations`, `integration_logs`, `integration_secrets`, `ai_insights_cache`.
- Created views: `project_stats`, `goal_stats`.
- Created functions: `handle_new_user`, `create_team`, `is_team_member`, `is_team_admin`, `is_team_admin_or_leader`, `is_project_member_or_team_admin`, `auto_confirm`, `sync_task_status_progress`, `sync_kr_status`, `can_access_goal`, `can_edit_goal`, `validate_learning_entry_links`, `validate_blocker_links`, `sync_blocker_resolved_at`, `get_integration_secret`.

## Known Issues

- None

## Phase 12 QA Audit (2026-08-26)
- **Features Tested:** 42/42
- **Features Passed:** 42/42
- **Bugs Discovered & Fixed:** 
  1. Missing Foreign Key indexes causing sequential scans (Fixed via Migration 000013).
  2. `ai_insights_cache` allowed client insertions (Fixed via Migration 000012).
- **Security Results:** RLS isolation and Secret masking verified via programmatic testing of 18 discrete role constraints.
- **Production Readiness Status:** 🟡 DEPLOYMENT-READY, PENDING SUCCESSFUL PRODUCTION BUILD, DEPLOYMENT VALIDATION, AND FINAL RESPONSIVE/ACCESSIBILITY TESTING.

