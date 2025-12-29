export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          player_id: string
          session_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id: string
          session_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_with_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          age_group: string | null
          archived_at: string | null
          created_at: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          season: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          season?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          season?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_archive: {
        Row: {
          age_group: string | null
          archived_at: string | null
          created_at: string | null
          deleted_at: string
          gender: string | null
          id: string
          is_active: boolean | null
          name: string | null
          notes: string | null
          season: string | null
          team_id: string | null
        }
        Insert: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          deleted_at?: string
          gender?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          season?: string | null
          team_id?: string | null
        }
        Update: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          deleted_at?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          season?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          player_id: string
          player_notes: string | null
          score: number
          session_id: string
          updated_at: string | null
          valence_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id: string
          player_notes?: string | null
          score: number
          session_id: string
          updated_at?: string | null
          valence_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          player_notes?: string | null
          score?: number
          session_id?: string
          updated_at?: string | null
          valence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "evaluations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "evaluations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_with_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          archived_at: string | null
          birth_date: string | null
          category_id: string | null
          created_at: string | null
          dominant_leg: string | null
          id: string
          is_active: boolean | null
          jersey_number: number | null
          medical_notes: string | null
          name: string
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          position: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          birth_date?: string | null
          category_id?: string | null
          created_at?: string | null
          dominant_leg?: string | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          medical_notes?: string | null
          name: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          position?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          birth_date?: string | null
          category_id?: string | null
          created_at?: string | null
          dominant_leg?: string | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          medical_notes?: string | null
          name?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          position?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players_archive: {
        Row: {
          archived_at: string | null
          birth_date: string | null
          category_id: string | null
          created_at: string | null
          deleted_at: string
          id: string
          is_active: boolean | null
          jersey_number: number | null
          name: string | null
          notes: string | null
          position: string | null
          team_id: string | null
        }
        Insert: {
          archived_at?: string | null
          birth_date?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string
          id: string
          is_active?: boolean | null
          jersey_number?: number | null
          name?: string | null
          notes?: string | null
          position?: string | null
          team_id?: string | null
        }
        Update: {
          archived_at?: string | null
          birth_date?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          name?: string | null
          notes?: string | null
          position?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_premium: boolean | null
          player_id: string
          purchased_at: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          player_id: string
          purchased_at?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          player_id?: string
          purchased_at?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_with_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          id: string
          is_present: boolean
          notes: string | null
          player_id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          id?: string
          is_present?: boolean
          notes?: string | null
          player_id: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          id?: string
          is_present?: boolean
          notes?: string | null
          player_id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_with_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      session_templates: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          selected_valences: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          selected_valences: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          selected_valences?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          category_id: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          location: string | null
          notes: string | null
          selected_valences: string[]
          started_at: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          selected_valences: string[]
          started_at?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          selected_valences?: string[]
          started_at?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          started_at: string | null
          status: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          started_at?: string | null
          status: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          started_at?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          archived_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          location: string | null
          name: string
          notes: string | null
          season: string | null
          sport: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          season?: string | null
          sport?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          season?: string | null
          sport?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_archive: {
        Row: {
          age_group: string | null
          archived_at: string | null
          created_at: string | null
          deleted_at: string
          id: string
          is_archived: boolean | null
          name: string | null
          notes: string | null
          season: string | null
          sport: string | null
          user_id: string | null
        }
        Insert: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          deleted_at?: string
          id: string
          is_archived?: boolean | null
          name?: string | null
          notes?: string | null
          season?: string | null
          sport?: string | null
          user_id?: string | null
        }
        Update: {
          age_group?: string | null
          archived_at?: string | null
          created_at?: string | null
          deleted_at?: string
          id?: string
          is_archived?: boolean | null
          name?: string | null
          notes?: string | null
          season?: string | null
          sport?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          ai_insights_reset_at: string | null
          ai_insights_used: number | null
          bio: string | null
          coaching_license: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          email: string
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          phone: string | null
          plan_type: string | null
          profile_picture_url: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_type: string | null
          years_experience: number | null
        }
        Insert: {
          ai_insights_reset_at?: string | null
          ai_insights_used?: number | null
          bio?: string | null
          coaching_license?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          phone?: string | null
          plan_type?: string | null
          profile_picture_url?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Update: {
          ai_insights_reset_at?: string | null
          ai_insights_used?: number | null
          bio?: string | null
          coaching_license?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          plan_type?: string | null
          profile_picture_url?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      users_archive: {
        Row: {
          bio: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          deleted_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          phone: string | null
          plan_type: string | null
          user_type: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          deleted_at?: string
          email?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          plan_type?: string | null
          user_type?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          deleted_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          plan_type?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      player_assignments: {
        Row: {
          age_group: string | null
          assignment_level: string | null
          category_id: string | null
          category_name: string | null
          jersey_number: number | null
          player_id: string | null
          player_name: string | null
          position: string | null
          team_id: string | null
          team_name: string | null
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          average_score: number | null
          evaluation_count: number | null
          evaluation_dates: string[] | null
          max_score: number | null
          min_score: number | null
          player_id: string | null
          player_name: string | null
          score_history: number[] | null
          team_id: string | null
          valence: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_with_attendance: {
        Row: {
          absent_count: number | null
          attendance_rate: number | null
          category_id: string | null
          created_at: string | null
          date: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          ended_at: string | null
          id: string | null
          location: string | null
          notes: string | null
          present_count: number | null
          selected_valences: string[] | null
          started_at: string | null
          status: string | null
          team_id: string | null
          total_players: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "player_assignments"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_stats: {
        Row: {
          team_average_score: number | null
          team_id: string | null
          team_name: string | null
          total_evaluations: number | null
          total_players: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_attendance_rate: {
        Args: { player_id_param: string; team_id_param?: string }
        Returns: {
          attendance_rate: number
          attended_sessions: number
          total_sessions: number
        }[]
      }
      cleanup_old_archived_items: { Args: never; Returns: undefined }
      cleanup_old_deactivated_users: { Args: never; Returns: undefined }
      deactivate_user_account: {
        Args: { reason_param?: string; user_id_param: string }
        Returns: undefined
      }
      expire_trials: { Args: never; Returns: number }
      get_session_attendance_summary: {
        Args: { session_id_param: string }
        Returns: {
          absent_count: number
          attendance_rate: number
          present_count: number
          total_players: number
        }[]
      }
      get_tier_limits: {
        Args: { tier: string }
        Returns: {
          max_ai_insights_per_month: number
          max_players_per_team: number
          max_teams: number
        }[]
      }
      has_tier_access: { Args: { required_tier: string }; Returns: boolean }
      increment_ai_insights_usage: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      reactivate_user_account: {
        Args: { user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

