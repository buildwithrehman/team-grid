const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email1 = `admin_${Date.now()}@test.com`;
  const email2 = `snooper_${Date.now()}@test.com`;
  const password = 'Password123!';

  console.log('1. Setting up users...');
  const { data: auth1 } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Admin User' } } });
  const { data: auth2 } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Snooper User' } } });
  await new Promise(r => setTimeout(r, 1000));

  await supabase.auth.signInWithPassword({ email: email1, password });
  const adminId = auth1.user.id;
  const snooperId = auth2.user.id;

  console.log('2. Creating Team and Project (Admin)...');
  const { data: teamId } = await supabase.rpc('create_team', { team_name: 'Alpha Team', team_description: 'Test Team' });
  const { data: project } = await supabase.from('projects').insert({ team_id: teamId, name: 'Alpha Project', owner_id: adminId }).select().single();
  
  // Create tasks and goals
  const { data: task } = await supabase.from('tasks').insert({ project_id: project.id, title: 'Alpha Task', assigned_to: adminId, created_by: adminId }).select().single();
  const { data: goal } = await supabase.from('goals').insert({ title: 'Alpha Goal', goal_type: 'project', project_id: project.id, owner_id: adminId, created_by: adminId }).select().single();
  const { data: kr } = await supabase.from('key_results').insert({ goal_id: goal.id, title: 'KR1', target_value: 100, current_value: 0 }).select().single();
  const { data: milestone } = await supabase.from('milestones').insert({ project_id: project.id, title: 'M1', created_by: adminId }).select().single();

  console.log('3. Switch to Snooper (No Team Access)...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email2, password });

  // Test RLS Reads
  console.log('Testing Snooper Reads (Should all be empty/null):');
  const { data: tData } = await supabase.from('teams').select('*').eq('id', teamId);
  const { data: pData } = await supabase.from('projects').select('*').eq('id', project.id);
  const { data: tsData } = await supabase.from('tasks').select('*').eq('id', task.id);
  const { data: gData } = await supabase.from('goals').select('*').eq('id', goal.id);
  const { data: krData } = await supabase.from('key_results').select('*').eq('id', kr.id);
  const { data: mData } = await supabase.from('milestones').select('*').eq('id', milestone.id);
  
  if (tData.length || pData.length || tsData.length || gData.length || krData.length || mData.length) {
    console.error('RLS READ LEAK DETECTED');
  } else {
    console.log('RLS Reads Secure.');
  }

  // Test RLS Writes
  console.log('Testing Snooper Writes (Should all fail/be empty array):');
  // Since update with RLS doesn't throw, it returns empty array. We check it.
  const { data: updProj } = await supabase.from('projects').update({ name: 'Hacked' }).eq('id', project.id).select();
  const { data: updTask } = await supabase.from('tasks').update({ title: 'Hacked' }).eq('id', task.id).select();
  const { data: updGoal } = await supabase.from('goals').update({ title: 'Hacked' }).eq('id', goal.id).select();
  const { data: updKr } = await supabase.from('key_results').update({ current_value: 100 }).eq('id', kr.id).select();
  
  // Insert tests (should throw)
  const { error: insTaskErr } = await supabase.from('tasks').insert({ project_id: project.id, title: 'Hacked Task', created_by: snooperId });
  const { error: insGoalErr } = await supabase.from('goals').insert({ project_id: project.id, title: 'Hacked Goal', goal_type: 'project', owner_id: snooperId, created_by: snooperId });
  
  if (updProj.length || updTask.length || updGoal.length || updKr.length) {
    console.error('RLS UPDATE LEAK DETECTED');
  } else if (!insTaskErr || !insGoalErr) {
    console.error('RLS INSERT LEAK DETECTED (Error was missing)');
  } else {
    console.log('RLS Writes Secure.');
  }

  // 4. Test Progress Sync logic
  console.log('4. Testing DB Progress Calculation triggers...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email1, password });

  // Mark KR completed by reaching target
  await supabase.from('key_results').update({ current_value: 100 }).eq('id', kr.id);
  const { data: checkKr } = await supabase.from('key_results').select('status').eq('id', kr.id).single();
  console.log('KR Status after reaching target (Expected: completed):', checkKr.status);

  // Mark task completed
  await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id);
  const { data: checkTask } = await supabase.from('tasks').select('progress').eq('id', task.id).single();
  console.log('Task Progress after status=completed (Expected: 100):', checkTask.progress);

  // Mark task progress = 100
  await supabase.from('tasks').update({ status: 'todo', progress: 0 }).eq('id', task.id); // Reset
  await supabase.from('tasks').update({ progress: 100 }).eq('id', task.id);
  const { data: checkTask2 } = await supabase.from('tasks').select('status').eq('id', task.id).single();
  console.log('Task Status after progress=100 (Expected: completed):', checkTask2.status);

  // 5. Test Archiving
  console.log('5. Testing Project Archiving...');
  await supabase.from('projects').update({ is_archived: true }).eq('id', project.id);
  const { data: archProj } = await supabase.from('projects').select('is_archived').eq('id', project.id).single();
  console.log('Project Archived:', archProj.is_archived);

  console.log('Done!');
}

runTest();
