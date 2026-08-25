# Team Grid — Development Memory

## Current Phase

Phase 1 — Authentication & Team Management (Completed)

## Completed Work

- (Phase 0) Initialized Next.js app with TypeScript, Tailwind CSS, and ESLint.
- (Phase 0) Set up `shadcn/ui` foundation (Lucide, Radix UI) with custom Tailwind config.
- (Phase 0) Created required folder structure (`app`, `components`, `lib`, etc.).
- (Phase 0) Installed Supabase packages (`@supabase/supabase-js`, `@supabase/ssr`).
- (Phase 0) Created Supabase utility clients for browser, server, and proxy middleware.
- (Phase 0) Configured font to `Inter` and set Design.md colors in `globals.css`.
- (Phase 0) Created `.env.local` and `.env.example` templates.
- **(Phase 1) Used Google Stitch MCP to design Login, Sign-up, and Team Onboarding pages.**
- **(Phase 1) Created and applied Supabase DB migrations for `profiles`, `teams`, and `team_members`.**
- **(Phase 1) Configured Row Level Security (RLS) on all tables with infinite-recursion fixes.**
- **(Phase 1) Built UI and Next.js server actions for Login, Sign-up, Logout, and Onboarding.**
- **(Phase 1) Enforced auth protection via `proxy.ts` middleware.**

## Approved Stitch Designs

- Login Page (Desktop/Mobile)
- Sign-up Page (Desktop/Mobile)
- Team Onboarding Page (Desktop/Mobile)

## Stitch Project Information

Project ID: 15192830507371185774
Screens: Login, Sign-up, Onboarding

## Dependencies Added

- `shadcn/ui` components: `input`, `label`, `card`

## Technical Decisions

- **Auth Flow**: Users sign up -> Profile created via Postgres Trigger -> User lands on `/onboarding` to create first team -> Redirected to `/dashboard`.
- **RLS Recursion Fix**: Implemented `security definer` functions `is_team_member` and `is_team_admin` to prevent infinite recursion on `team_members` select policies.
- **Team Roles**: Roles (`admin`, `team_leader`, `team_member`) are team-specific, stored in `team_members` to allow a user to have different access levels on different teams.
- **Email Confirmation**: Added an `auto_confirm` trigger to bypass email requirements for testing environments.

## Database Changes

- Migrations applied to Supabase project `xtuwzfszrijoeqxtfkyy`.
- Created tables: `profiles`, `teams`, `team_members`.
- Created functions: `handle_new_user`, `create_team`, `is_team_member`, `is_team_admin`, `auto_confirm`.

## Known Issues

- None

## Next Step

Begin Phase 2 (Projects).

