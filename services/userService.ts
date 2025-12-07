import { supabase } from '../lib/supabase';

export type UserType = 'coach' | 'player';
export type PlanType = 'free' | 'basic' | 'premium';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  user_type: UserType;
  plan_type?: PlanType;
  created_at: string;
  updated_at: string;
}

/**
 * User Service
 * Handles user profile operations
 */
export const userService = {
  /**
   * Get user profile from public.users table
   */
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { profile: data as UserProfile, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { profile: null, error: error as Error };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string, 
    updates: { name?: string; phone?: string; email?: string; user_type?: UserType }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // If email was updated, also update auth.users
      if (updates.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email,
        });
        if (authError) throw authError;
      }

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Update user plan type
   */
  async updatePlanType(
    userId: string, 
    planType: PlanType
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          plan_type: planType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update plan type error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete user account
   * This will delete all related data via CASCADE
   * Note: Auth user remains in auth.users but profile is deleted
   */
  async deleteAccount(userId: string): Promise<{ error: Error | null }> {
    try {
      console.log('🗑️ Starting account deletion for user:', userId);
      
      // Delete all user data from public.users
      // This will CASCADE delete teams, players, sessions, etc.
      const { error: deleteError, data } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();

      if (deleteError) {
        console.error('❌ Error deleting user profile:', deleteError);
        throw new Error(`Erro ao deletar perfil: ${deleteError.message}`);
      }

      console.log('✅ User profile deleted successfully:', data);

      // Sign out the user
      // Note: We cannot delete from auth.users via client-side code
      // The auth user will remain but without a profile
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('⚠️ Error signing out:', signOutError);
        throw new Error(`Erro ao fazer logout: ${signOutError.message}`);
      }

      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Delete account error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Request account deletion
   * In production, this would create a deletion request ticket
   */
  async requestAccountDeletion(userId: string, reason?: string): Promise<{ error: Error | null }> {
    try {
      // For MVP, we'll just delete immediately
      // In production, you'd want to:
      // 1. Create a deletion request
      // 2. Send confirmation email
      // 3. Wait 30 days before permanent deletion
      // 4. Allow cancellation during waiting period

      console.log(`Deletion requested for user ${userId}. Reason: ${reason || 'Not provided'}`);
      
      return await this.deleteAccount(userId);
    } catch (error) {
      console.error('Request account deletion error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Change password error:', error);
      return { error: error as Error };
    }
  },
};

