const { calculateTeamWorkload } = require('./lib/calculations/workload');
const { calculateUpcomingDeadlines } = require('./lib/calculations/deadlines');
const { calculateProjectHealth } = require('./lib/calculations/projectHealth');

function testCalculations() {
  console.log('--- Testing Workload ---');
  const tasks = [
    { assigned_to: 'user_1', status: 'todo' },
    { assigned_to: 'user_1', status: 'in_progress' },
    { assigned_to: 'user_1', status: 'review' },
    { assigned_to: 'user_1', status: 'todo' },
    { assigned_to: 'user_2', status: 'todo' },
    { assigned_to: 'user_3', status: 'completed' }, // Should be ignored
  ];

  // Provide mock profiles
  const members = [
    { profiles: { id: 'user_1', full_name: 'U1' } },
    { profiles: { id: 'user_2', full_name: 'U2' } },
    { profiles: { id: 'user_3', full_name: 'U3' } },
  ];

  const workload = calculateTeamWorkload(tasks, members);
  console.log('U1 Workload (Expected 4 / Moderate):', workload.find(w => w.user.id === 'user_1').workloadCount, workload.find(w => w.user.id === 'user_1').status);
  console.log('U2 Workload (Expected 1 / Light):', workload.find(w => w.user.id === 'user_2').workloadCount, workload.find(w => w.user.id === 'user_2').status);
  console.log('U3 Workload (Expected 0 / Light):', workload.find(w => w.user.id === 'user_3').workloadCount, workload.find(w => w.user.id === 'user_3').status);


  console.log('\n--- Testing Health ---');
  const today = new Date();
  
  const h1 = calculateProjectHealth({
    target_date: new Date(today.getTime() + 10 * 24*60*60*1000).toISOString(),
    progress: 90
  }, [], []);
  console.log('H1 (Expected: Healthy)', h1.status);

  const h2 = calculateProjectHealth({
    target_date: new Date(today.getTime() - 2 * 24*60*60*1000).toISOString(),
    progress: 99
  }, [], []);
  console.log('H2 (Expected: Critical - past deadline)', h2.status);

  const h3 = calculateProjectHealth({
    target_date: new Date(today.getTime() + 5 * 24*60*60*1000).toISOString(),
    progress: 10
  }, [], []);
  console.log('H3 (Expected: At Risk - low progress near deadline)', h3.status);

  console.log('Done!');
}

testCalculations();
