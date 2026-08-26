const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email1 = `leader_${Date.now()}@teamgrid.com`;
  const email2 = `member_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up leader and member...');
  const { data: leaderAuth } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Leader' } } });
  const { data: memberAuth } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Member' } } });

  await new Promise(r => setTimeout(r, 1000)); // wait for triggers

  // Sign in as leader
  await supabase.auth.signInWithPassword({ email: email1, password });
  const leaderId = leaderAuth.user.id;
  const memberId = memberAuth.user.id;

  console.log('2. Leader creating a team...');
  const { data: teamId } = await supabase.rpc('create_team', {
    team_name: 'Alpha Team',
    team_description: 'Test Team'
  });

  console.log('3. Leader adding member to team...');
  // Leader adds member to team_members
  const { error: tmError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: memberId,
    role: 'team_member'
  });
  if (tmError) console.error('Add team member error:', tmError);

  console.log('4. Leader creating a project...');
  const { data: project, error: pError } = await supabase.from('projects').insert({
    team_id: teamId,
    name: 'Apollo Launch',
    description: 'To the moon',
    owner_id: leaderId,
    priority: 'high'
  }).select().single();
  
  if (pError) console.error('Create project error:', pError);

  console.log('5. Leader adding member to project...');
  const { error: pmError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: memberId
  });
  if (pmError) console.error('Add project member error:', pmError);

  console.log('6. Member testing access...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email2, password });

  const { data: visibleProjects, error: fetchError } = await supabase.from('projects').select('*');
  if (fetchError) console.error('Member fetch error:', fetchError);
  console.log('Member sees projects:', visibleProjects?.map(p => p.name));

  console.log('7. Member trying to update project (should fail if not owner or admin)...');
  const { data: updatedData, error: updateError } = await supabase.from('projects').update({ name: 'Hacked!' }).eq('id', project.id).select();
  console.log('Member update data:', updatedData);

  console.log('8. Leader archiving project...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email1, password });
  const { error: archiveError } = await supabase.from('projects').update({ is_archived: true }).eq('id', project.id);
  if (archiveError) console.error('Archive error:', archiveError);
  else console.log('Archived successfully.');

  console.log('Done!');
}

runTest();
