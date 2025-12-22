import { useState, useCallback, useEffect, useMemo } from 'react';
import { Evaluation } from '@/types';

const STORAGE_KEY_EVALUATIONS = 'basecoach:evaluations';
const STORAGE_KEY_METADATA = 'basecoach:sessionMetadata';

interface Player {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
}

interface SessionMetadata {
  sessionId: string;
  teamId: string;
  currentPlayerIndex: number;
  lastSaved: number;
}

interface UseEvaluationManagerReturn {
  // Current state
  currentPlayerIndex: number;
  currentPlayer: Player | null;
  evaluations: Evaluation[];
  
  // Navigation
  nextPlayer: () => void;
  previousPlayer: () => void;
  goToPlayer: (index: number) => void;
  
  // Scoring
  setScore: (playerId: string, valenceId: string, score: number) => void;
  getPlayerEvaluation: (playerId: string) => Evaluation | null;
  
  // Progress
  progress: number;
  evaluatedCount: number;
  unevaluatedPlayers: Player[];
  
  // Notes
  setPlayerNote: (playerId: string, note: string) => void;
  getPlayerNote: (playerId: string) => string;
  playerNotes: { [playerId: string]: string };
  
  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  clearLocalStorage: () => void;
}

/**
 * Custom hook for managing player evaluations during a match session
 * Handles navigation, scoring, notes, and localStorage persistence
 */
export function useEvaluationManager(
  players: Player[],
  sessionId: string
): UseEvaluationManagerReturn {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [playerNotes, setPlayerNotes] = useState<{ [playerId: string]: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentPlayer = useMemo(() => {
    return players[currentPlayerIndex] || null;
  }, [players, currentPlayerIndex]);

  // Save to localStorage (debounced)
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVALUATIONS, JSON.stringify(evaluations));
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify({
        sessionId,
        teamId: players[0]?.id || '',
        currentPlayerIndex,
        lastSaved: Date.now(),
      } as SessionMetadata));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.warn('Failed to save evaluations:', error);
    }
  }, [evaluations, sessionId, currentPlayerIndex, players]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const storedEvaluations = localStorage.getItem(STORAGE_KEY_EVALUATIONS);
      const storedMetadata = localStorage.getItem(STORAGE_KEY_METADATA);

      if (storedEvaluations && storedMetadata) {
        const metadata: SessionMetadata = JSON.parse(storedMetadata);
        
        // Only restore if it's the same session
        if (metadata.sessionId === sessionId) {
          setEvaluations(JSON.parse(storedEvaluations));
          setCurrentPlayerIndex(metadata.currentPlayerIndex);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load evaluations:', error);
    }
    return false;
  }, [sessionId]);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_EVALUATIONS);
      localStorage.removeItem(STORAGE_KEY_METADATA);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.warn('Failed to clear evaluations:', error);
    }
  }, []);

  // Auto-save when evaluations change (debounced)
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage();
      }, 2000); // Debounce 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, saveToLocalStorage]);

  // Warn on page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && evaluations.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, evaluations.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentPlayerIndex > 0) {
        setCurrentPlayerIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPlayerIndex, players.length]);

  // Navigation functions
  const nextPlayer = useCallback(() => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    }
  }, [currentPlayerIndex, players.length]);

  const previousPlayer = useCallback(() => {
    if (currentPlayerIndex > 0) {
      setCurrentPlayerIndex(prev => prev - 1);
    }
  }, [currentPlayerIndex]);

  const goToPlayer = useCallback((index: number) => {
    if (index >= 0 && index < players.length) {
      setCurrentPlayerIndex(index);
    }
  }, [players.length]);

  // Scoring functions
  const setScore = useCallback((playerId: string, valenceId: string, score: number) => {
    setEvaluations(prev => {
      const existingEval = prev.find(e => e.playerId === playerId);
      
      if (existingEval) {
        // Update existing evaluation
        return prev.map(e => 
          e.playerId === playerId
            ? { ...e, scores: { ...e.scores, [valenceId]: score } }
            : e
        );
      } else {
        // Create new evaluation
        return [...prev, {
          playerId,
          sessionId,
          scores: { [valenceId]: score },
          timestamp: Date.now(),
        }];
      }
    });
    setHasUnsavedChanges(true);
  }, [sessionId]);

  const getPlayerEvaluation = useCallback((playerId: string): Evaluation | null => {
    return evaluations.find(e => e.playerId === playerId) || null;
  }, [evaluations]);

  // Notes functions
  const setPlayerNote = useCallback((playerId: string, note: string) => {
    setPlayerNotes(prev => ({ ...prev, [playerId]: note }));
    setHasUnsavedChanges(true);
  }, []);

  const getPlayerNote = useCallback((playerId: string): string => {
    return playerNotes[playerId] || '';
  }, [playerNotes]);

  // Progress calculations
  const evaluatedCount = useMemo(() => {
    return evaluations.filter(e => Object.keys(e.scores).length > 0).length;
  }, [evaluations]);

  const unevaluatedPlayers = useMemo(() => {
    return players.filter(player => {
      const evaluation = evaluations.find(e => e.playerId === player.id);
      return !evaluation || Object.keys(evaluation.scores).length === 0;
    });
  }, [players, evaluations]);

  const progress = useMemo(() => {
    if (players.length === 0) return 0;
    return Math.round((evaluatedCount / players.length) * 100);
  }, [evaluatedCount, players.length]);

  return {
    // Current state
    currentPlayerIndex,
    currentPlayer,
    evaluations,
    
    // Navigation
    nextPlayer,
    previousPlayer,
    goToPlayer,
    
    // Scoring
    setScore,
    getPlayerEvaluation,
    
    // Progress
    progress,
    evaluatedCount,
    unevaluatedPlayers,
    
    // Notes
    setPlayerNote,
    getPlayerNote,
    playerNotes,
    
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
  };
}

