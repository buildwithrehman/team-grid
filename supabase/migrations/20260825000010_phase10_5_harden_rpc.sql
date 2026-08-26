-- Drop the existing function to cleanly redefine its permissions
drop function if exists get_integration_secret(uuid);

-- Create the function with explicit search_path to prevent search_path manipulation
create or replace function public.get_integration_secret(intg_id uuid)
returns text
security definer
set search_path = public
as $$
declare
  sec text;
begin
  -- Since this is exclusively called by the trusted service_role backend,
  -- and we've revoked public access, we don't need to check auth.uid()
  -- (which would be null anyway for service_role).
  select secret into sec from public.integration_secrets where integration_id = intg_id;
  return sec;
end;
$$ language plpgsql;

-- CRITICAL FIX: Revoke execute from public (which includes authenticated and anon)
revoke execute on function public.get_integration_secret(uuid) from public;
revoke execute on function public.get_integration_secret(uuid) from authenticated;
revoke execute on function public.get_integration_secret(uuid) from anon;

-- Grant execute exclusively to the trusted service_role
grant execute on function public.get_integration_secret(uuid) to service_role;
