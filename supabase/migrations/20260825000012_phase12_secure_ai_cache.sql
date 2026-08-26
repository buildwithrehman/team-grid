-- Drop the insert policy for authenticated users so they cannot spoof AI insights
drop policy if exists "Team members can insert ai cache" on public.ai_insights_cache;

-- Ensure authenticated users can only READ the cache
-- (The select policy "Team members can view ai cache" remains)
