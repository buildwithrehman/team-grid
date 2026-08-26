create or replace function get_integration_secret(intg_id uuid)
returns text
security definer
as $$
declare
  sec text;
begin
  if not exists (select 1 from team_integrations ti where ti.id = intg_id and public.is_team_member(ti.team_id)) then
    return null;
  end if;
  
  select secret into sec from integration_secrets where integration_id = intg_id;
  return sec;
end;
$$ language plpgsql;
