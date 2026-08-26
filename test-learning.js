import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email = `learner_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up user...');
  const { data: authUser } = await supabase.auth.signUp({ email, password, options: { data: { full_name: 'Test Learner' } } });
  
  await new Promise(r => setTimeout(r, 1000));
  await supabase.auth.signInWithPassword({ email, password });
  const userId = authUser.user.id;

  console.log('2. Testing Skill Creation (Global)...');
  const { data: skill, error: skillError } = await supabase.from('skills').insert({
    name: `Test Skill ${Date.now()}`,
    category: 'programming'
  }).select().single();
  if (skillError) console.error('Skill Error:', skillError);

  console.log('3. Testing User Skill Linking...');
  const { data: userSkill, error: usError } = await supabase.from('user_skills').insert({
    user_id: userId,
    skill_id: skill.id,
    current_level: 'beginner'
  }).select().single();
  if (usError) console.error('User Skill Error:', usError);

  console.log('4. Testing Duplicate User Skill Linking (Should Fail)...');
  const { error: dupError } = await supabase.from('user_skills').insert({
    user_id: userId,
    skill_id: skill.id,
    current_level: 'expert'
  });
  if (dupError) console.log('Duplicate appropriately prevented!');
  else console.error('Duplicate NOT prevented!');

  console.log('5. Testing Learning Entry Creation...');
  const { data: entry, error: entryError } = await supabase.from('learning_entries').insert({
    user_id: userId,
    title: 'Learned React Basics',
    learning_type: 'course',
    status: 'completed'
  }).select().single();
  if (entryError) console.error('Learning Entry Error:', entryError);
  
  console.log('6. Testing Entry-Skill Joins...');
  const { error: joinError } = await supabase.from('learning_entry_skills').insert({
    learning_entry_id: entry.id,
    skill_id: skill.id
  });
  if (joinError) console.error('Join Error:', joinError);

  console.log('7. Testing RLS on Personal Learning Entry...');
  // A completely separate user
  const { data: strangerAuth } = await supabase.auth.signUp({ email: `snooper_${Date.now()}@teamgrid.com`, password, options: { data: { full_name: 'Snooper' } } });
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email: strangerAuth.user.email, password });
  
  const { data: snoopedEntries } = await supabase.from('learning_entries').select('*').eq('id', entry.id);
  console.log('Snooper accessing learning entry:', snoopedEntries.length === 0 ? 'Blocked (0) - SUCCESS' : 'FAILED');

  console.log('Done!');
}

runTest();
