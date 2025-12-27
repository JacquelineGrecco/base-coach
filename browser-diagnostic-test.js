/**
 * Browser Console Test Script
 * Copy and paste this into your browser console while on http://localhost:3000
 * This will help diagnose if the issue is database or session-related
 */

console.log('🔍 Starting Base Coach Diagnostics...\n');

// Test 1: Check if Supabase client exists
console.log('='.repeat(60));
console.log('TEST 1: Supabase Client');
console.log('='.repeat(60));
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client is available');
} else {
  console.log('❌ Supabase client NOT found - trying window.supabase');
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase;
    console.log('✅ Found at window.supabase');
  } else {
    console.log('❌ CRITICAL: Cannot find Supabase client');
  }
}

// Test 2: Check authentication session
console.log('\n' + '='.repeat(60));
console.log('TEST 2: Authentication Session');
console.log('='.repeat(60));
const sessionCheck = await supabase.auth.getSession();
if (sessionCheck.data.session) {
  console.log('✅ Session EXISTS');
  console.log('   User ID:', sessionCheck.data.session.user.id);
  console.log('   Email:', sessionCheck.data.session.user.email);
  console.log('   Expires at:', new Date(sessionCheck.data.session.expires_at * 1000).toLocaleString());
  
  // Check if expiring soon
  const expiresIn = sessionCheck.data.session.expires_at - Math.floor(Date.now() / 1000);
  console.log('   Expires in:', Math.floor(expiresIn / 60), 'minutes');
  
  if (expiresIn < 300) {
    console.log('⚠️  Session expiring soon! Will auto-refresh.');
  }
} else {
  console.log('❌ NO SESSION - User not authenticated');
  console.log('   This is the problem! Please login.');
}

// Test 3: Check user profile in database
console.log('\n' + '='.repeat(60));
console.log('TEST 3: User Profile in Database');
console.log('='.repeat(60));
if (sessionCheck.data.session) {
  const userId = sessionCheck.data.session.user.id;
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    console.log('❌ ERROR fetching profile:', profileError.message);
  } else if (profile) {
    console.log('✅ User profile EXISTS');
    console.log('   Name:', profile.name);
    console.log('   Active:', profile.is_active ? 'Yes' : 'No');
    console.log('   Plan:', profile.plan_type || 'free');
  } else {
    console.log('❌ User profile NOT FOUND in database');
  }
}

// Test 4: Check teams
console.log('\n' + '='.repeat(60));
console.log('TEST 4: Teams');
console.log('='.repeat(60));
const { data: teams, error: teamsError } = await supabase
  .from('teams')
  .select('id, name, user_id')
  .limit(10);

if (teamsError) {
  console.log('❌ ERROR fetching teams:', teamsError.message);
  console.log('   Code:', teamsError.code);
  console.log('   Details:', teamsError.details);
  console.log('   Hint:', teamsError.hint);
} else {
  console.log(`✅ Found ${teams.length} team(s)`);
  teams.forEach((team, i) => {
    console.log(`   ${i + 1}. ${team.name} (ID: ${team.id})`);
    if (sessionCheck.data.session && team.user_id === sessionCheck.data.session.user.id) {
      console.log('      ✅ YOU own this team');
    } else {
      console.log('      ⚠️  NOT your team (ownership issue!)');
    }
  });
}

// Test 5: Check players
console.log('\n' + '='.repeat(60));
console.log('TEST 5: Players');
console.log('='.repeat(60));
const { data: players, error: playersError } = await supabase
  .from('players')
  .select('id, name, jersey_number, team_id, is_active')
  .limit(10);

if (playersError) {
  console.log('❌ ERROR fetching players:', playersError.message);
  console.log('   Code:', playersError.code);
  console.log('   Details:', playersError.details);
  console.log('   Hint:', playersError.hint);
  
  // Check if it's an RLS issue
  if (playersError.code === 'PGRST116' || playersError.message?.includes('permission')) {
    console.log('\n🔍 This looks like an RLS (Row Level Security) issue!');
    console.log('   The database is blocking access due to security policies.');
    console.log('   Next step: Run the diagnostic SQL script in Supabase');
  }
} else {
  console.log(`✅ Found ${players.length} player(s)`);
  players.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.name} (Jersey: ${player.jersey_number || 'N/A'})`);
    console.log(`      Team ID: ${player.team_id}`);
    console.log(`      Active: ${player.is_active ? 'Yes' : 'No'}`);
  });
}

// Test 6: Check active players count
console.log('\n' + '='.repeat(60));
console.log('TEST 6: Active Players Count');
console.log('='.repeat(60));
const { count: activeCount } = await supabase
  .from('players')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);

const { count: totalCount } = await supabase
  .from('players')
  .select('*', { count: 'exact', head: true });

console.log(`Active players: ${activeCount || 0}`);
console.log(`Total players: ${totalCount || 0}`);
console.log(`Inactive players: ${(totalCount || 0) - (activeCount || 0)}`);

if (activeCount === 0 && totalCount > 0) {
  console.log('⚠️  WARNING: You have players but they are all INACTIVE!');
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

const issues = [];
if (!sessionCheck.data.session) issues.push('❌ No session - Login required');
if (teamsError) issues.push('❌ Cannot fetch teams - ' + teamsError.message);
if (playersError) issues.push('❌ Cannot fetch players - ' + playersError.message);
if (teams?.length === 0) issues.push('⚠️  No teams found - Create a team first');
if (players?.length === 0 && !playersError) issues.push('⚠️  No players found - Add players to your team');
if (activeCount === 0 && totalCount > 0) issues.push('⚠️  All players are inactive');

if (issues.length === 0) {
  console.log('✅ All checks passed! The issue might be temporary.');
  console.log('   Try refreshing the page.');
} else {
  console.log('Found issues:\n');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
  
  console.log('\n📝 Next steps:');
  if (!sessionCheck.data.session) {
    console.log('1. Login to the application');
  }
  if (playersError?.code === 'PGRST116' || playersError?.message?.includes('permission')) {
    console.log('1. Run the diagnostic SQL script in Supabase SQL Editor');
    console.log('   File: /supabase/diagnostic_query.sql');
  }
  if (teams?.length === 0) {
    console.log('1. Create a team in the Teams section');
  }
  if (players?.length === 0) {
    console.log('1. Add players to your team');
  }
}

console.log('\n' + '='.repeat(60));
console.log('Diagnostics complete! ✨');
console.log('='.repeat(60));

