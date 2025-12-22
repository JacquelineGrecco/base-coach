import { supabase } from '@/lib/supabase';

export interface Team {
  id: string;
  user_id: string;
  name: string;
  sport: string;
  age_group?: string;
  season?: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  category_count?: number;
  player_count?: number;
}

export const teamService = {
  /**
   * Get all teams for current user
   */
  async getTeams(includeArchived = false): Promise<{ teams: Team[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('teams')
        .select('*')
        .order('name');

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get category and player counts for each team
      const teamsWithCounts = await Promise.all(
        (data || []).map(async (team) => {
          // Count categories
          const { count: categoryCount } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);

          // Count players
          const { count: playerCount } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);

          return {
            ...team,
            category_count: categoryCount || 0,
            player_count: playerCount || 0,
          };
        })
      );

      return { teams: teamsWithCounts, error: null };
    } catch (error) {
      console.error('Get teams error:', error);
      return { teams: null, error: error as Error };
    }
  },

  /**
   * Get a single team by ID
   */
  async getTeam(teamId: string): Promise<{ team: Team | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;

      // Get counts
      const { count: categoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);

      const { count: playerCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);

      return {
        team: data ? {
          ...data,
          category_count: categoryCount || 0,
          player_count: playerCount || 0,
        } : null,
        error: null,
      };
    } catch (error) {
      console.error('Get team error:', error);
      return { team: null, error: error as Error };
    }
  },

  /**
   * Create a new team
   */
  async createTeam(teamData: {
    name: string;
    sport: string;
    age_group?: string;
    season?: string;
    notes?: string;
  }): Promise<{ team: Team | null; error: Error | null }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          user_id: user.id,  // ← FIX: Include user_id!
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { team: data, error: null };
    } catch (error) {
      console.error('Create team error:', error);
      return { team: null, error: error as Error };
    }
  },

  /**
   * Update a team
   */
  async updateTeam(
    teamId: string,
    updates: {
      name?: string;
      sport?: string;
      age_group?: string;
      season?: string;
      notes?: string;
      is_archived?: boolean;
    }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', teamId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update team error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Archive a team (soft delete)
   * Also archives all categories and players in the team
   */
  async archiveTeam(teamId: string): Promise<{ error: Error | null }> {
    try {
      const now = new Date().toISOString();
      
      // First, archive all players in this team (both with and without categories)
      const playerUpdates: any = {
        is_active: false,
        archived_at: now,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('players')
        .update(playerUpdates)
        .eq('team_id', teamId);

      // Then, archive all categories in this team
      const categoryUpdates: any = {
        is_active: false,
        archived_at: now,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('categories')
        .update(categoryUpdates)
        .eq('team_id', teamId);

      // Finally, archive the team itself
      const teamUpdates: any = {
        is_archived: true,
        archived_at: now,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('teams')
        .update(teamUpdates)
        .eq('id', teamId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Archive team error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Unarchive a team
   * Also restores all categories and players in the team
   */
  async unarchiveTeam(teamId: string): Promise<{ error: Error | null }> {
    try {
      const now = new Date().toISOString();
      
      // First, restore all players in this team
      const playerUpdates: any = {
        is_active: true,
        archived_at: null,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('players')
        .update(playerUpdates)
        .eq('team_id', teamId);

      // Then, restore all categories in this team
      const categoryUpdates: any = {
        is_active: true,
        archived_at: null,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('categories')
        .update(categoryUpdates)
        .eq('team_id', teamId);

      // Finally, unarchive the team itself
      const teamUpdates: any = {
        is_archived: false,
        archived_at: null,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('teams')
        .update(teamUpdates)
        .eq('id', teamId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Unarchive team error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a team permanently (cascades to categories and players)
   */
  async deleteTeam(teamId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete team error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get team-level players (no category assigned)
   */
  async getTeamLevelPlayers(teamId: string): Promise<{ players: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .is('category_id', null)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { players: data, error: null };
    } catch (error) {
      console.error('Get team-level players error:', error);
      return { players: null, error: error as Error };
    }
  },
};

