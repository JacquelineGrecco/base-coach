/**
 * Session Refresh Utility
 * Provides automatic session refresh and validation
 */

import { supabase } from './supabase';

/**
 * Checks if the current session is valid and refreshes if needed
 * @returns {Promise<boolean>} True if session is valid or was successfully refreshed
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return false;
    }
    
    if (!session) {
      console.warn('No active session found');
      return false;
    }
    
    // Check if token is about to expire (less than 5 minutes remaining)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
      
      if (expiresIn < 300) { // Less than 5 minutes
        console.log('Token expiring soon, refreshing...');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }
        
        if (!newSession) {
          console.error('No session returned after refresh');
          return false;
        }
        
        console.log('Session refreshed successfully');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    return false;
  }
}

/**
 * Gets the current session or throws an error
 * Useful for API calls that require authentication
 */
export async function requireSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('Erro ao verificar sessão: ' + error.message);
  }
  
  if (!session) {
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }
  
  return session;
}

/**
 * Sets up automatic session refresh
 * Call this once in your app initialization
 */
export function setupAutoRefresh() {
  // Refresh session every 4 minutes if the app is active
  const interval = setInterval(async () => {
    if (document.visibilityState === 'visible') {
      await ensureValidSession();
    }
  }, 4 * 60 * 1000); // 4 minutes
  
  // Clean up on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
  }
  
  return () => clearInterval(interval);
}

