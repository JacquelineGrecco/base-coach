import { supabase } from '../lib/supabase';

export interface Session {
  id: string;
  team_id: string;
  category_id?: string | null;
  date: string;
  selected_valences: string[];
  notes?: string;
  location?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  team_name?: string;
  category_name?: string;
  evaluation_count?: number;
}

export interface SessionEvaluation {
  id: string;
  session_id: string;
  player_id: string;
  valence_id: string;
  score: number; // 0-5
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  player_name?: string;
  valence_name?: string;
}

export const sessionService = {
  /**
   * Get all sessions for current user
   */
  async getSessions(teamId?: string): Promise<{ sessions: Session[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          teams!inner(name),
          categories(name)
        `)
        .order('date', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to include team and category names
      const sessions = (data || []).map((session: any) => ({
        ...session,
        team_name: session.teams?.name,
        category_name: session.categories?.name,
      }));

      // Get evaluation counts for each session
      const sessionsWithCounts = await Promise.all(
        sessions.map(async (session) => {
          const { count } = await supabase
            .from('evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            evaluation_count: count || 0,
          };
        })
      );

      return { sessions: sessionsWithCounts, error: null };
    } catch (error) {
      console.error('Get sessions error:', error);
      return { sessions: null, error: error as Error };
    }
  },

  /**
   * Get a single session by ID with all evaluations
   */
  async getSession(sessionId: string): Promise<{ 
    session: Session | null; 
    evaluations: SessionEvaluation[] | null;
    error: Error | null 
  }> {
    try {
      // Get session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          teams(name),
          categories(name)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get evaluations for this session
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select(`
          *,
          players(name)
        `)
        .eq('session_id', sessionId);

      if (evaluationsError) throw evaluationsError;

      const session = {
        ...sessionData,
        team_name: sessionData.teams?.name,
        category_name: sessionData.categories?.name,
      };

      const evaluations = (evaluationsData || []).map((evaluation: any) => ({
        ...evaluation,
        player_name: evaluation.players?.name,
      }));

      return { session, evaluations, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, evaluations: null, error: error as Error };
    }
  },

  /**
   * Create a new session
   */
  async createSession(sessionData: {
    team_id: string;
    category_id?: string | null;
    date: string;
    selected_valences: string[];
    notes?: string;
    location?: string;
    duration_minutes?: number;
  }): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...sessionData,
          date: sessionData.date || new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { session: data, error: null };
    } catch (error) {
      console.error('Create session error:', error);
      return { session: null, error: error as Error };
    }
  },

  /**
   * Save evaluations for a session
   */
  async saveEvaluations(
    sessionId: string,
    evaluations: Array<{
      player_id: string;
      valence_id: string;
      score: number;
      notes?: string;
    }>
  ): Promise<{ error: Error | null }> {
    try {
      // Prepare evaluations with session_id
      const evaluationsWithSession = evaluations.map((evaluation) => ({
        session_id: sessionId,
        ...evaluation,
      }));

      const { error } = await supabase
        .from('evaluations')
        .insert(evaluationsWithSession as any);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Save evaluations error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Update session details
   */
  async updateSession(
    sessionId: string,
    updates: {
      notes?: string;
      location?: string;
      duration_minutes?: number;
    }
  ): Promise<{ error: Error | null }> {
    try {
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update session error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a session (cascades to evaluations)
   */
  async deleteSession(sessionId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete session error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get player statistics across all sessions
   */
  async getPlayerStats(playerId: string): Promise<{ 
    stats: any | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('player_id', playerId);

      if (error) throw error;

      // Calculate averages by valence
      const statsByValence = (data || []).reduce((acc: any, evaluation: any) => {
        if (!acc[evaluation.valence_id]) {
          acc[evaluation.valence_id] = {
            total: 0,
            count: 0,
            scores: [],
          };
        }
        acc[evaluation.valence_id].total += evaluation.score;
        acc[evaluation.valence_id].count += 1;
        acc[evaluation.valence_id].scores.push(evaluation.score);
        return acc;
      }, {});

      // Calculate averages
      const stats = Object.entries(statsByValence).map(([valenceId, data]: [string, any]) => ({
        valence_id: valenceId,
        average: data.total / data.count,
        count: data.count,
        min: Math.min(...data.scores),
        max: Math.max(...data.scores),
      }));

      return { stats, error: null };
    } catch (error) {
      console.error('Get player stats error:', error);
      return { stats: null, error: error as Error };
    }
  },
};

