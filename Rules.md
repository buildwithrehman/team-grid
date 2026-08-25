Team Grid — AI Engineering Rules

Rule 1 — Read Project Context First
Before working, read: PRD.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md (if it exists).

Rule 2 — Design Responsibility
Google Stitch is the primary system for UI design. Antigravity must not independently redesign approved screens.

Rule 3 — Stitch MCP Usage
When a new major UI screen is required: Check whether a Stitch design already exists. If no design exists, use Stitch through MCP to generate the screen. Review the generated result. Iterate until approved. Implement the approved design.

Rule 4 — Antigravity Engineering Responsibility
Antigravity is responsible for: Next.js implementation, Component architecture, TypeScript, Backend integration, Supabase, Authentication, Authorization, Database, Business logic, Testing.

Rule 5 — Never Blindly Copy Generated Code
AI-generated frontend code must be reviewed. Remove unnecessary code, duplicated styles. Add TypeScript types. Make components reusable. Connect real data.

Rule 6 — No Fake Functionality
Do not hardcode fake progress or use mock data for completed backend features.

Rule 7 — Follow Current Phase
Implement only the current phase. Do not build future features early.

Rule 8 — Preserve Design Consistency
All screens must follow the approved Stitch design, Design.md, existing component patterns. Do not introduce random fonts, colors, etc.

Rule 9 — Update Memory
After each phase, update Memory.md.
