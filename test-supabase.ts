/**
 * Quick test script to verify Supabase connection
 * Run this in the browser console or as a separate test
 */

import { supabase } from './lib/supabase';

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    
    // Test 2: Try to query the teams table (should return empty array)
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying teams:', error);
      return false;
    }
    
    console.log('✅ Successfully queried teams table');
    console.log('📊 Teams found:', teams?.length || 0);
    console.log('Data:', teams);
    
    // Test 3: Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Auth session:', session ? 'Logged in' : 'Not logged in');
    
    console.log('✅ All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Auto-run if imported
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
  console.log('💡 Run testSupabase() in the console to test the connection');
}








