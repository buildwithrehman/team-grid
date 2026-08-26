const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email1 = `goal_owner_${Date.now()}@teamgrid.com`;
  const email2 = `goal_snooper_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up owner and snooper...');
  const { data: ownerAuth } = await supabase.auth.signUp({ email: email1, password, options: { data: { full_name: 'Goal Owner' } } });
  const { data: snooperAuth } = await supabase.auth.signUp({ email: email2, password, options: { data: { full_name: 'Goal Snooper' } } });

  await new Promise(r => setTimeout(r, 1000)); // wait for triggers

  await supabase.auth.signInWithPassword({ email: email1, password });
  const ownerId = ownerAuth.user.id;
  
  console.log('2. Owner creating a personal goal...');
  const { data: goal, error: goalError } = await supabase.from('goals').insert({
    title: 'Learn AI',
    description: 'Learn agentic workflows',
    goal_type: 'personal',
    owner_id: ownerId,
    created_by: ownerId,
  }).select().single();
  
  if (goalError) {
    console.error('Owner goal create error:', goalError);
    return;
  }
  
  console.log('3. Owner creating a Key Result (target 10)...');
  const { data: kr } = await supabase.from('key_results').insert({
    goal_id: goal.id,
    title: 'Read 10 papers',
    target_value: 10,
    current_value: 0
  }).select().single();

  console.log('4. Owner updating KR to 10 (should autocomplete)...');
  await supabase.from('key_results').update({ current_value: 10 }).eq('id', kr.id);
  
  const { data: updatedKr } = await supabase.from('key_results').select('status, current_value').eq('id', kr.id).single();
  console.log('KR Status:', updatedKr.status);
  
  console.log('5. Checking Goal Progress...');
  const { data: stats } = await supabase.from('goal_stats').select('*').eq('goal_id', goal.id).single();
  console.log('Goal Stats:', stats);

  console.log('6. Snooper trying to access personal goal...');
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: email2, password });

  const { data: snoopedGoals } = await supabase.from('goals').select('*').eq('id', goal.id);
  console.log('Snooped Goals (should be empty array):', snoopedGoals);

  console.log('Done!');
}

runTest();
