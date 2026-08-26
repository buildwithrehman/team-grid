const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email1 = `dashboard_leader_${Date.now()}@teamgrid.com`;
  const email2 = `dashboard_member_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up leader and member...');
  const { data: leaderAuth } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Dash Leader' } } });
  const { data: memberAuth } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Dash Member' } } });

  await new Promise(r => setTimeout(r, 1000)); // wait for triggers

  await supabase.auth.signInWithPassword({ email: email1, password });
  const leaderId = leaderAuth.user.id;
  const memberId = memberAuth.user.id;

  console.log('2. Leader creating team and project...');
  const { data: teamId } = await supabase.rpc('create_team', { team_name: 'Dashboard Team', team_description: 'Dash Test' });
  await supabase.from('team_members').insert({ team_id: teamId, user_id: memberId, role: 'team_member' });
  
  // Create an At Risk project (deadline in 2 days)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  
  const { data: project } = await supabase.from('projects').insert({
    team_id: teamId, name: 'At Risk Project', owner_id: leaderId, target_deadline: targetDate.toISOString()
  }).select().single();
  await supabase.from('project_members').insert({ project_id: project.id, user_id: memberId });

  console.log('3. Assigning tasks to member (Heavy Workload)...');
  // Create 8 tasks assigned to member
  const tasks = Array.from({length: 8}).map((_, i) => ({
    project_id: project.id,
    title: `Task ${i}`,
    assigned_to: memberId,
    created_by: leaderId,
    status: 'todo'
  }));
  await supabase.from('tasks').insert(tasks);

  console.log('4. Fetching member workload data (simulating server side)...');
  const { data: activeTasks } = await supabase.from('tasks').select('*').eq('assigned_to', memberId).neq('status', 'completed');
  console.log(`Member has ${activeTasks.length} active tasks.`);

  if (activeTasks.length >= 8) {
    console.log('Workload correctly Heavy!');
  } else {
    console.error('Workload not heavy as expected.');
  }

  console.log('5. Testing RLS protection on dashboard query...');
  // A completely separate user
  const { data: strangerAuth } = await supabase.auth.signUp({ email: `stranger_${Date.now()}@teamgrid.com`, password, options: { data: { full_name: 'Stranger' } } });
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: strangerAuth.user.email, password });
  
  const { data: strangerProjects } = await supabase.from('projects').select('*').in('team_id', [teamId]);
  console.log('Stranger accessing projects from team:', strangerProjects.length === 0 ? 'Blocked (0) - SUCCESS' : 'FAILED');

  console.log('Done!');
}

runTest();
