const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email1 = `task_leader_${Date.now()}@teamgrid.com`;
  const email2 = `task_member_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up leader and member...');
  const { data: leaderAuth } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Task Leader' } } });
  const { data: memberAuth } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Task Member' } } });

  await new Promise(r => setTimeout(r, 1000)); // wait for triggers

  await supabase.auth.signInWithPassword({ email: email1, password });
  const leaderId = leaderAuth.user.id;
  const memberId = memberAuth.user.id;

  console.log('2. Leader creating team and project...');
  const { data: teamId } = await supabase.rpc('create_team', { team_name: 'Bravo Team', team_description: 'Task Test' });
  await supabase.from('team_members').insert({ team_id: teamId, user_id: memberId, role: 'team_member' });
  
  const { data: project } = await supabase.from('projects').insert({
    team_id: teamId, name: 'Project Bravo', owner_id: leaderId
  }).select().single();
  await supabase.from('project_members').insert({ project_id: project.id, user_id: memberId });

  console.log('3. Member creating a task...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email2, password });

  const { data: task, error: taskError } = await supabase.from('tasks').insert({
    project_id: project.id,
    title: 'Write Docs',
    description: 'API docs',
    assigned_to: memberId,
    created_by: memberId,
    status: 'todo',
    progress: 10 // should be allowed
  }).select().single();

  if (taskError) {
    console.error('Member task create error:', taskError);
    return;
  }
  console.log('Task created by member:', task.title, 'Progress:', task.progress);

  console.log('4. Testing progress trigger (Complete task)...');
  await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id);
  
  const { data: completedTask } = await supabase.from('tasks').select('status, progress').eq('id', task.id).single();
  console.log('After status=completed:', completedTask);
  
  console.log('5. Testing status trigger (Progress 100)...');
  // First set back to in_progress
  await supabase.from('tasks').update({ status: 'in_progress', progress: 50 }).eq('id', task.id);
  // Then set progress to 100
  await supabase.from('tasks').update({ progress: 100 }).eq('id', task.id);
  
  const { data: progressTask } = await supabase.from('tasks').select('status, progress').eq('id', task.id).single();
  console.log('After progress=100:', progressTask);

  console.log('6. Checking project stats view...');
  const { data: stats, error: statsError } = await supabase.from('project_stats').select('*').eq('project_id', project.id).single();
  console.log('Project Stats:', stats);

  console.log('Done!');
}

runTest();
