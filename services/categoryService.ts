import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  team_id: string;
  name: string;
  age_group?: string;
  season?: string;
  gender?: 'masculino' | 'feminino' | 'misto';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  player_count?: number;
}

export const categoryService = {
  /**
   * Get all categories for a team
   */
  async getCategoriesByTeam(teamId: string): Promise<{ categories: Category[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Get player count for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('is_active', true);

          return {
            ...category,
            player_count: count || 0,
          };
        })
      );

      return { categories: categoriesWithCounts, error: null };
    } catch (error) {
      console.error('Get categories error:', error);
      return { categories: null, error: error as Error };
    }
  },

  /**
   * Get a single category by ID
   */
  async getCategory(categoryId: string): Promise<{ category: Category | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      // Get player count
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_active', true);

      return {
        category: data ? { ...data, player_count: count || 0 } : null,
        error: null,
      };
    } catch (error) {
      console.error('Get category error:', error);
      return { category: null, error: error as Error };
    }
  },

  /**
   * Create a new category
   */
  async createCategory(
    teamId: string,
    categoryData: {
      name: string;
      age_group?: string;
      season?: string;
      gender?: 'masculino' | 'feminino' | 'misto';
      notes?: string;
    }
  ): Promise<{ category: Category | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          team_id: teamId,
          ...categoryData,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { category: data, error: null };
    } catch (error) {
      console.error('Create category error:', error);
      return { category: null, error: error as Error };
    }
  },

  /**
   * Update a category
   */
  async updateCategory(
    categoryId: string,
    updates: {
      name?: string;
      age_group?: string;
      season?: string;
      gender?: 'masculino' | 'feminino' | 'misto';
      notes?: string;
      is_active?: boolean;
    }
  ): Promise<{ error: Error | null }> {
    try {
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', categoryId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update category error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a category (soft delete by setting is_active = false)
   */
  async archiveCategory(categoryId: string): Promise<{ error: Error | null }> {
    try {
      const now = new Date().toISOString();
      
      // First, deactivate all players in this category
      const playerUpdates: any = { 
        is_active: false,
        archived_at: now,
        updated_at: now
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('players')
        .update(playerUpdates)
        .eq('category_id', categoryId);

      // Then archive the category
      const categoryUpdates: any = {
        is_active: false,
        archived_at: now,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('categories')
        .update(categoryUpdates)
        .eq('id', categoryId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Archive category error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Restore an archived category
   */
  async restoreCategory(categoryId: string): Promise<{ error: Error | null }> {
    try {
      const now = new Date().toISOString();
      
      // First, reactivate all players in this category
      const playerUpdates: any = { 
        is_active: true,
        archived_at: null,
        updated_at: now
      };
      
      // @ts-ignore - Supabase update type inference issue
      await supabase
        .from('players')
        .update(playerUpdates)
        .eq('category_id', categoryId);

      // Then restore the category
      const categoryUpdates: any = {
        is_active: true,
        archived_at: null,
        updated_at: now,
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('categories')
        .update(categoryUpdates)
        .eq('id', categoryId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Restore category error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Hard delete a category (use with caution!)
   * This will cascade delete all players in the category due to ON DELETE CASCADE
   */
  async deleteCategory(categoryId: string): Promise<{ error: Error | null }> {
    try {
      // Note: Players will be automatically handled by CASCADE DELETE in database
      // But we can also explicitly delete them for clarity
      await supabase
        .from('players')
        .delete()
        .eq('category_id', categoryId);

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete category error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get all players in a category
   */
  async getCategoryPlayers(categoryId: string): Promise<{ players: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { players: data, error: null };
    } catch (error) {
      console.error('Get category players error:', error);
      return { players: null, error: error as Error };
    }
  },

  /**
   * Assign player to category
   */
  async assignPlayerToCategory(playerId: string, categoryId: string | null): Promise<{ error: Error | null }> {
    try {
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('players')
        .update({
          category_id: categoryId,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', playerId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Assign player to category error:', error);
      return { error: error as Error };
    }
  },
};

