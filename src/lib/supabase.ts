import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, these might not be available
// Create a placeholder client that will be replaced at runtime
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    // Build time - use placeholder values
    console.warn('⚠️  Building without Supabase env vars - will be set at runtime');
  } else if (typeof window !== 'undefined') {
    // Runtime in browser - validate and show helpful error
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please ensure the following are set in Vercel:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error(
      'Missing Supabase environment variables. Please check deployment configuration.'
    );
  }
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

