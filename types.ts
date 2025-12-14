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
  scores: { [valenceId: string]: number };
  notes?: string;
}

