const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPhase7() {
  console.log('--- PHASE 7 TESTS ---');
  
  const email = `test_${Date.now()}@test.com`;
  const password = 'Password123!';

  const { data: auth } = await supabase.auth.signUp({ email, password, options: { data: { full_name: 'Test User' } } });
  await new Promise(r => setTimeout(r, 1000));
  await supabase.auth.signInWithPassword({ email, password });
  
  const userId = auth.user.id;
  const { data: teamId } = await supabase.rpc('create_team', { team_name: 'Test Team', team_description: 'Test Team' });
  
  console.log(`Using User: ${userId}, Team: ${teamId}`);

  // 2. Test Weekly Check-in boundaries and duplicates
  const weekStart = '2026-10-12';
  const weekEnd = '2026-10-18';
  
  console.log('1. Creating first check-in...');
  const { data: checkin1, error: err1 } = await supabase.from('weekly_checkins').insert({
    user_id: userId,
    team_id: teamId,
    week_start_date: weekStart,
    week_end_date: weekEnd,
    status: 'draft',
    confidence_level: 4
  }).select().single();
  
  if (err1 && err1.code !== '23505') {
    console.error('Failed to create check-in:', err1);
  } else {
    console.log('First checkin handled.');
  }

  console.log('2. Attempting duplicate check-in (should fail)...');
  const { error: err2 } = await supabase.from('weekly_checkins').insert({
    user_id: userId,
    team_id: teamId,
    week_start_date: weekStart,
    week_end_date: weekEnd,
    status: 'draft'
  });
  
  if (err2 && err2.code === '23505') {
    console.log('SUCCESS: Duplicate check-in was prevented by constraint.');
  } else {
    console.error('FAIL: Duplicate check-in was NOT prevented!', err2);
  }

  // 3. Test Blocker creation and resolved_at trigger
  console.log('3. Creating a Blocker...');
  const { data: blocker, error: err3 } = await supabase.from('blockers').insert({
    team_id: teamId,
    reported_by: userId,
    title: 'Test Blocker',
    severity: 'critical'
  }).select().single();

  if (err3) {
    console.error('Failed to create blocker:', err3);
  } else {
    console.log('Blocker created:', blocker.id);
    
    console.log('4. Resolving Blocker...');
    const { data: resolvedBlocker, error: err4 } = await supabase.from('blockers').update({
      status: 'resolved'
    }).eq('id', blocker.id).select().single();
    
    if (resolvedBlocker && resolvedBlocker.resolved_at) {
      console.log('SUCCESS: Blocker resolved_at was automatically set to:', resolvedBlocker.resolved_at);
    } else {
      console.error('FAIL: Blocker resolved_at was NOT set!');
    }
  }

  console.log('All tests finished.');
}

testPhase7();
