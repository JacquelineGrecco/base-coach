import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileError: string | null;
  clearProfileError: () => void;
  signUp: (email: string, password: string, name: string, phone?: string, userType?: 'coach' | 'player') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        // Verify that the user has a profile
        await validateUserProfile(authUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { user: authUser } = await authService.getCurrentUser();
      if (authUser) {
        await validateUserProfile(authUser);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function validateUserProfile(authUser: User) {
    try {
      // Check if user has a profile in the database
      const { profile, error } = await userService.getUserProfile(authUser.id);
      
      if (error || !profile) {
        console.warn('⚠️ Auth user exists but profile is missing. Signing out...');
        console.warn('This usually happens when an account was deleted.');
        
        // Set error message for user to see
        setProfileError(
          'Esta conta foi deletada. Se você deseja usar o BaseCoach novamente, crie uma nova conta.'
        );
        
        // Sign out the user since they don't have a valid profile
        await authService.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if account is deactivated
      if (profile.is_active === false && profile.deactivated_at) {
        const deactivatedDate = new Date(profile.deactivated_at);
        const now = new Date();
        const daysSinceDeactivation = Math.floor((now.getTime() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceDeactivation >= 365) {
          // Account needs support to reactivate
          setProfileError(
            `Esta conta foi desativada há ${daysSinceDeactivation} dias. Para reativar, entre em contato com o suporte.`
          );
        } else {
          // Account can still be reactivated by support
          setProfileError(
            `Esta conta foi desativada há ${daysSinceDeactivation} dias. Entre em contato com o suporte para reativar. (${365 - daysSinceDeactivation} dias restantes)`
          );
        }
        
        // Sign out the user
        await authService.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // Profile exists and is active, set the user
      setUser(authUser);
      setLoading(false);
    } catch (error) {
      console.error('Error validating user profile:', error);
      
      // Set generic error message
      setProfileError('Erro ao validar sua conta. Tente fazer login novamente.');
      
      // On error, sign out to be safe
      await authService.signOut();
      setUser(null);
      setLoading(false);
    }
  }
  
  function clearProfileError() {
    setProfileError(null);
  }

  async function signUp(email: string, password: string, name: string, phone?: string, userType: 'coach' | 'player' = 'coach') {
    const { error } = await authService.signUp(email, password, name, phone, userType);
    return { error };
  }

  async function signIn(email: string, password: string) {
    const { error } = await authService.signIn(email, password);
    return { error };
  }

  async function signOut() {
    await authService.signOut();
    setUser(null);
  }

  const value = {
    user,
    loading,
    profileError,
    clearProfileError,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}







