const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPhase8() {
  console.log('--- PHASE 8 TESTS ---');
  
  const email1 = `test_a_${Date.now()}@test.com`;
  const email2 = `test_b_${Date.now()}@test.com`;
  const password = 'Password123!';

  // Create User 1 and User 2
  const { data: auth1 } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Alice User' } } });
  const { data: auth2 } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Bob User' } } });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Login as User 1
  await supabase.auth.signInWithPassword({ email: email1, password });
  const user1 = auth1.user.id;
  const user2 = auth2.user.id;
  
  // Create Team 1
  const { data: teamId } = await supabase.rpc('create_team', { team_name: 'Alpha Team', team_description: 'Test Team' });
  
  console.log(`User 1: ${user1}, User 2: ${user2}, Team: ${teamId}`);

  // Test Activity insert/select as User 1
  console.log('1. Inserting Activity Event as User 1...');
  const { data: act1, error: err1 } = await supabase.from('activity_events').insert({
    team_id: teamId,
    actor_id: user1,
    event_type: 'test_event',
    entity_type: 'test',
    entity_id: user1
  }).select().single();

  if (err1) console.error('FAIL: Could not insert activity', err1);
  else console.log('SUCCESS: Inserted Activity:', act1.id);

  console.log('2. Viewing Activity as User 1...');
  const { data: acts, error: err2 } = await supabase.from('activity_events').select('*').eq('team_id', teamId);
  if (acts && acts.length > 0) console.log('SUCCESS: User 1 can see activity.');
  else console.error('FAIL: User 1 cannot see activity!', err2);

  // Test Notifications
  console.log('3. Triggering a notification insert for User 2 (via backend simulation)...');
  await supabase.from('notifications').insert({
    user_id: user2,
    team_id: teamId,
    type: 'task_assigned',
    title: 'Test',
    message: 'Test message',
    related_entity_type: 'test',
    related_entity_id: user2
  });

  console.log('4. Trying to view User 2 notifications as User 1...');
  const { data: notifs, error: err3 } = await supabase.from('notifications').select('*').eq('user_id', user2);
  if (notifs && notifs.length === 0) {
    console.log('SUCCESS: User 1 cannot see User 2 notifications.');
  } else {
    console.error('FAIL: User 1 saw User 2 notifications!', notifs);
  }

  // Login as User 2
  await supabase.auth.signInWithPassword({ email: email2, password });
  console.log('5. Viewing User 2 notifications as User 2...');
  const { data: notifs2, error: err4 } = await supabase.from('notifications').select('*').eq('user_id', user2);
  
  if (notifs2 && notifs2.length > 0) {
    console.log('SUCCESS: User 2 sees their own notification.');
    
    // Mark as read
    console.log('6. Marking User 2 notification as read...');
    const { data: updated, error: err5 } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notifs2[0].id)
      .select()
      .single();
      
    if (updated && updated.read_at) {
      console.log('SUCCESS: User 2 marked notification as read.');
    } else {
      console.error('FAIL: Could not mark as read!', err5);
    }

  } else {
    console.error('FAIL: User 2 cannot see their own notification!', err4);
  }

  console.log('All tests finished.');
}

testPhase8();
