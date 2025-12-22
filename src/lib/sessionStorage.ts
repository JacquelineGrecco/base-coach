/**
 * Typed localStorage wrapper for session persistence
 */

import { Evaluation } from '@/types';

export interface SessionData {
  sessionId: string;
  teamId: string;
  categoryId: string | null;
  selectedValenceIds: string[];
  presentPlayerIds: string[];
  evaluations: Evaluation[];
  currentPlayerIndex: number;
  duration: number;
  isPaused: boolean;
  notes?: string;
  lastSaved: number;
}

const STORAGE_KEY = 'basecoach:activeSession';

/**
 * Save active session to localStorage
 */
export function saveSession(data: SessionData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error);
  }
}

/**
 * Load active session from localStorage
 */
export function loadSession(): SessionData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as SessionData;
      
      // Check if session is not too old (e.g., 24 hours)
      const ageHours = (Date.now() - data.lastSaved) / (1000 * 60 * 60);
      if (ageHours > 24) {
        clearSession();
        return null;
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to load session from localStorage:', error);
  }
  return null;
}

/**
 * Clear active session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error);
  }
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  return loadSession() !== null;
}

/**
 * Get session age in minutes
 */
export function getSessionAge(): number | null {
  const session = loadSession();
  if (!session) return null;
  
  return Math.floor((Date.now() - session.lastSaved) / (1000 * 60));
}

export const sessionStorage = {
  save: saveSession,
  load: loadSession,
  clear: clearSession,
  hasActive: hasActiveSession,
  getAge: getSessionAge,
};

