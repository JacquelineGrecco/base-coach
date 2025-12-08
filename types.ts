// Futsal player positions
export type PlayerPosition = 'Goleiro' | 'Fixo' | 'Ala' | 'Pivô';

// Legacy Position enum (kept for backwards compatibility)
export enum Position {
  GOALKEEPER = "GK",
  FIXO = "Fixo",
  ALA_LEFT = "Ala (Left)",
  ALA_RIGHT = "Ala (Right)",
  PIVO = "Pivo",
  UNIVERSAL = "Universal"
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  photoUrl: string;
  dominantLeg: "Left" | "Right" | "Both";
  category: string; // e.g., U-15
}

export interface Valence {
  id: string;
  name: string;
  category: "Technical" | "Tactical" | "Physical" | "Mental";
}

export interface Evaluation {
  playerId: string;
  sessionId: string;
  scores: Record<string, number>; // valenceId -> score (0-5)
  timestamp: number;
}

export interface Session {
  id: string;
  teamId: string;
  date: string; // ISO date
  durationMinutes: number;
  type: "Training" | "Match" | "Assessment";
  status: "Active" | "Completed";
  evaluations: Evaluation[];
  selectedValenceIds?: string[]; // Max 3 valences per session
}

export interface PlayerReport {
  playerId: string;
  sessionId: string;
  description: string; // 200-300 characters
  strengths: string[];
  weaknesses: string[];
  generatedAt: number;
  isPremium?: boolean; // For paid reports feature
}

export interface Team {
  id: string;
  name: string;
  category: string;
  players: Player[];
}

export interface Drill {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  isAiGenerated?: boolean;
}

export type ViewState = "DASHBOARD" | "SESSION_SETUP" | "ACTIVE_SESSION" | "REPORTS" | "DRILLS" | "PROFILE" | "TEAMS";

// Team management navigation
export type TeamView = "LIST" | "DETAIL" | "PLAYERS";
