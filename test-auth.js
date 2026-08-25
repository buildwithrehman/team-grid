const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email = `testuser_${Date.now()}@teamgrid.com`;
  const password = 'Password123!';

  console.log('1. Signing up...', email);
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Test User' }
    }
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError);
    return;
  }
  console.log('User ID:', authData.user.id);

  // Wait a moment for triggers to run
  await new Promise(r => setTimeout(r, 1000));

  console.log('1.5. Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('SignIn Error:', signInError);
    return;
  }
  
  console.log('2. Checking profile...');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('Profile created:', profileData);
  }

  console.log('3. Creating a team...');
  const { data: teamData, error: teamError } = await supabase.rpc('create_team', {
    team_name: 'Engineering',
    team_description: 'The engineers'
  });

  if (teamError) {
    console.error('Team Create Error:', teamError);
  } else {
    console.log('Team created with ID:', teamData);
  }

  console.log('4. Fetching team members...');
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('role, teams(name)');

  if (membersError) {
    console.error('Members Fetch Error:', membersError);
  } else {
    console.log('Members:', members);
  }

  console.log('5. Logging out...');
  await supabase.auth.signOut();
  console.log('Done!');
}

runTest();
