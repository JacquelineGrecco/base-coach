import { supabase } from '@/lib/supabase';

export type UserType = 'coach' | 'player';
export type PlanType = 'free' | 'basic' | 'premium';
export type CoachingLicense = 'Pro' | 'A' | 'B' | 'C' | 'None';

export interface CoachingProfile {
  years_experience?: number;
  coaching_license?: CoachingLicense;
  linkedin_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  profile_picture_url?: string;
  user_type: UserType;
  plan_type?: PlanType;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  deactivated_at?: string | null;
  deactivation_reason?: string | null;
  // Coaching-specific fields
  years_experience?: number;
  coaching_license?: CoachingLicense;
  linkedin_url?: string;
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
    updates: { 
      name?: string; 
      phone?: string; 
      email?: string; 
      bio?: string;
      profile_picture_url?: string;
      user_type?: UserType;
      years_experience?: number;
      coaching_license?: CoachingLicense;
      linkedin_url?: string;
    }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
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
        } as any)
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
   * Request account deactivation
   * User cannot login. Support must reactivate within 365 days.
   * After 365 days, account is permanently deleted.
   */
  async requestAccountDeactivation(userId: string, reason?: string): Promise<{ error: Error | null }> {
    try {
      console.log(`Account deactivation requested for user ${userId}. Reason: ${reason || 'Not provided'}`);
      
      // Call the deactivate_user_account function
      const { error } = await supabase.rpc('deactivate_user_account', {
        user_id_param: userId,
        reason_param: reason || null
      });

      if (error) throw error;

      // Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('⚠️ Error signing out:', signOutError);
        throw new Error(`Erro ao fazer logout: ${signOutError.message}`);
      }

      console.log('✅ User account deactivated successfully.');
      return { error: null };
    } catch (error) {
      console.error('Request account deactivation error:', error);
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

  /**
   * Resize image to max dimensions while maintaining aspect ratio
   */
  async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not create blob'));
                return;
              }
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            },
            'image/jpeg',
            0.9 // Quality
          );
        };
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload profile picture to Supabase Storage
   */
  async uploadProfilePicture(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      // Resize image if too large
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) {
        console.log('Resizing image...');
        fileToUpload = await this.resizeImage(file);
        
        // Check size again after resize
        if (fileToUpload.size > 2 * 1024 * 1024) {
          throw new Error('A imagem ainda é muito grande após redimensionar. Tente uma imagem menor.');
        }
      }

      // Generate unique filename
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update user profile with new picture URL
      const { error: updateError } = await this.updateProfile(userId, {
        profile_picture_url: publicUrl,
      });

      if (updateError) throw updateError;

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return { url: null, error: error as Error };
    }
  },

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId: string, pictureUrl: string): Promise<{ error: Error | null }> {
    try {
      // First, remove URL from profile (set to null)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_picture_url: null,
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Then delete from storage
      const urlParts = pictureUrl.split('/avatars/');
      if (urlParts.length >= 2) {
        const filePath = urlParts[1];
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        // Don't throw error if file doesn't exist in storage
        if (deleteError && !deleteError.message.includes('not found')) {
          console.error('Storage delete error:', deleteError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Delete profile picture error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Export all user data (GDPR compliance)
   */
  async exportUserData(userId: string): Promise<{ data: any | null; error: Error | null }> {
    try {
      // Get user profile
      const { profile } = await this.getUserProfile(userId);

      // Get all teams
      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', userId);

      // Get all players
      const { data: players } = await supabase
        .from('players')
        .select('*, team:teams!inner(name)')
        .eq('teams.user_id', userId);

      // Get all sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, team:teams!inner(name)')
        .eq('teams.user_id', userId);

      // Get all evaluations
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select(`
          *,
          session:sessions!inner(date, team:teams!inner(name)),
          player:players!inner(name)
        `)
        .eq('sessions.teams.user_id', userId);

      // Get all attendance records
      const { data: attendance } = await supabase
        .from('session_attendance')
        .select(`
          *,
          session:sessions!inner(date, team:teams!inner(name)),
          player:players!inner(name)
        `)
        .eq('sessions.teams.user_id', userId);

      const exportData = {
        export_date: new Date().toISOString(),
        profile: profile,
        teams: teams || [],
        players: players || [],
        sessions: sessions || [],
        evaluations: evaluations || [],
        attendance: attendance || [],
        total_records: {
          teams: teams?.length || 0,
          players: players?.length || 0,
          sessions: sessions?.length || 0,
          evaluations: evaluations?.length || 0,
          attendance: attendance?.length || 0,
        }
      };

      return { data: exportData, error: null };
    } catch (error) {
      console.error('Export user data error:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Convert data to CSV format
   */
  convertToCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value === null || value === undefined) return '';
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export user data as CSV files (multiple files in a zip would be ideal, but for now separate downloads)
   */
  async exportUserDataAsCSV(userId: string): Promise<{ error: Error | null }> {
    try {
      const { data, error } = await this.exportUserData(userId);
      
      if (error || !data) {
        throw error || new Error('Falha ao exportar dados');
      }

      const timestamp = new Date().toISOString().split('T')[0];

      // Export Profile
      if (data.profile) {
        const profileCSV = this.convertToCSV(
          [data.profile],
          ['id', 'name', 'email', 'phone', 'bio', 'plan_type', 'created_at']
        );
        this.downloadCSV(profileCSV, `basecoach-perfil-${timestamp}.csv`);
      }

      // Export Teams
      if (data.teams && data.teams.length > 0) {
        const teamsCSV = this.convertToCSV(
          data.teams,
          ['name', 'sport', 'age_group', 'season', 'is_archived', 'created_at']
        );
        this.downloadCSV(teamsCSV, `basecoach-times-${timestamp}.csv`);
      }

      // Export Players
      if (data.players && data.players.length > 0) {
        const playersData = data.players.map((p: any) => ({
          name: p.name,
          team: p.team?.name || '',
          position: p.position || '',
          jersey_number: p.jersey_number || '',
          birth_date: p.birth_date || '',
          is_active: p.is_active ? 'Ativo' : 'Inativo',
        }));
        const playersCSV = this.convertToCSV(
          playersData,
          ['name', 'team', 'position', 'jersey_number', 'birth_date', 'is_active']
        );
        this.downloadCSV(playersCSV, `basecoach-atletas-${timestamp}.csv`);
      }

      // Export Sessions
      if (data.sessions && data.sessions.length > 0) {
        const sessionsData = data.sessions.map((s: any) => ({
          team: s.team?.name || '',
          date: s.date,
          type: s.type || '',
          duration_minutes: s.duration_minutes || '',
          notes: s.notes || '',
        }));
        const sessionsCSV = this.convertToCSV(
          sessionsData,
          ['team', 'date', 'type', 'duration_minutes', 'notes']
        );
        this.downloadCSV(sessionsCSV, `basecoach-sessoes-${timestamp}.csv`);
      }

      // Export Evaluations
      if (data.evaluations && data.evaluations.length > 0) {
        const evaluationsData = data.evaluations.map((e: any) => ({
          player: e.player?.name || '',
          team: e.session?.team?.name || '',
          date: e.session?.date || '',
          valence: e.valence || '',
          score: e.score || '',
          notes: e.notes || '',
        }));
        const evaluationsCSV = this.convertToCSV(
          evaluationsData,
          ['player', 'team', 'date', 'valence', 'score', 'notes']
        );
        this.downloadCSV(evaluationsCSV, `basecoach-avaliacoes-${timestamp}.csv`);
      }

      // Export Attendance
      if (data.attendance && data.attendance.length > 0) {
        const attendanceData = data.attendance.map((a: any) => ({
          player: a.player?.name || '',
          team: a.session?.team?.name || '',
          date: a.session?.date || '',
          status: a.is_present ? 'Presente' : 'Ausente',
          arrival_time: a.arrival_time || '',
          notes: a.notes || '',
        }));
        const attendanceCSV = this.convertToCSV(
          attendanceData,
          ['player', 'team', 'date', 'status', 'arrival_time', 'notes']
        );
        this.downloadCSV(attendanceCSV, `basecoach-presenca-${timestamp}.csv`);
      }

      return { error: null };
    } catch (error) {
      console.error('Export CSV error:', error);
      return { error: error as Error };
    }
  },
};

