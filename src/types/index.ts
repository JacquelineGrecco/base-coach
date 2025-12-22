/**
 * Application TypeScript types
 */

export type ViewState =
  | "DASHBOARD"
  | "TEAMS"
  | "SESSION_SETUP"
  | "ACTIVE_SESSION"
  | "DRILLS"
  | "REPORTS"
  | "PRICING"
  | "PROFILE";

export interface Evaluation {
  playerId: string;
  sessionId: string;
  scores: { [valenceId: string]: number };
  notes?: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  category_id: string | null;
  position?: string;
  jersey_number?: number;
  birth_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  team_id: string;
  session_date: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

export interface Substitution {
  id: string;
  match_id: string;
  player_out_id: string;
  player_in_id: string;
  minute: number;
  reason?: 'tactical' | 'injury' | 'rest';
  created_at: string;
}

export interface AIInsight {
  id: string;
  player_id: string;
  generated_at: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overall_assessment: string;
}

export interface Drill {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  isAiGenerated?: boolean;
}

export interface PlayerReport {
  playerId: string;
  playerName: string;
  averageScore: number;
  evaluationCount: number;
  strengths: string[];
  weaknesses: string[];
}

export interface PlayerStats {
  valence_id: string;
  valence_name?: string;
  average: number;
  count: number;
  trend: number;
  min: number;
  max: number;
  scores: number[];
}

