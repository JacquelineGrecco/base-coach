/**
 * Database TypeScript types generated from Supabase schema
 * These types represent the database tables and their relationships
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sport: 'futsal' | 'football' | 'volleyball' | 'basketball' | 'handball';
          age_group: string | null;
          location: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sport?: 'futsal' | 'football' | 'volleyball' | 'basketball' | 'handball';
          age_group?: string | null;
          location?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sport?: 'futsal' | 'football' | 'volleyball' | 'basketball' | 'handball';
          age_group?: string | null;
          location?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          jersey_number: number | null;
          position: string | null;
          birth_date: string | null;
          photo_url: string | null;
          parent_name: string | null;
          parent_email: string | null;
          parent_phone: string | null;
          medical_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          jersey_number?: number | null;
          position?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
          parent_name?: string | null;
          parent_email?: string | null;
          parent_phone?: string | null;
          medical_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          jersey_number?: number | null;
          position?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
          parent_name?: string | null;
          parent_email?: string | null;
          parent_phone?: string | null;
          medical_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          team_id: string;
          date: string;
          selected_valences: string[];
          notes: string | null;
          location: string | null;
          duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          date: string;
          selected_valences: string[];
          notes?: string | null;
          location?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          date?: string;
          selected_valences?: string[];
          notes?: string | null;
          location?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          valence: string;
          score: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          valence: string;
          score: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          valence?: string;
          score?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          player_id: string;
          session_id: string;
          content: string;
          is_premium: boolean;
          purchased_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          session_id: string;
          content: string;
          is_premium?: boolean;
          purchased_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          session_id?: string;
          content?: string;
          is_premium?: boolean;
          purchased_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          status: 'present' | 'absent' | 'injured' | 'suspended';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          status: 'present' | 'absent' | 'injured' | 'suspended';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          status?: 'present' | 'absent' | 'injured' | 'suspended';
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      player_stats: {
        Row: {
          player_id: string;
          player_name: string;
          team_id: string;
          valence: string;
          evaluation_count: number;
          average_score: number;
          min_score: number;
          max_score: number;
          score_history: number[];
          evaluation_dates: string[];
        };
      };
      team_stats: {
        Row: {
          team_id: string;
          team_name: string;
          total_players: number;
          total_sessions: number;
          total_evaluations: number;
          team_average_score: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

