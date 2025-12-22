import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'basecoach:activeSubstitutions';

export interface PlayerStatus {
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  isOnPitch: boolean;
  minutesPlayed: number; // cumulative total
  lastSubTime: number | null; // match time (in seconds) of last substitution
  currentStintMinutes: number; // time since last sub or start
}

export interface Substitution {
  id: string;
  timestamp: number; // real-world timestamp
  playerOut: string;
  playerOutName: string;
  playerIn: string;
  playerInName: string;
  matchMinute: number; // match time in seconds
}

interface DbPlayer {
  id: string;
  name: string;
  jersey_number?: number;
}

/**
 * Custom hook to manage live substitutions with two-tap system
 * Tracks player minutes, substitution history, and current on-pitch status
 */
export function useSubstitutions(
  players: DbPlayer[],
  matchDuration: number, // in seconds
  initialOnPitchIds: string[] = []
) {
  const [playerStatuses, setPlayerStatuses] = useState<Map<string, PlayerStatus>>(new Map());
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);

  // Initialize player statuses on mount
  useEffect(() => {
    const statusMap = new Map<string, PlayerStatus>();
    
    players.forEach(player => {
      const isOnPitch = initialOnPitchIds.includes(player.id);
      statusMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        jerseyNumber: player.jersey_number,
        isOnPitch,
        minutesPlayed: 0,
        lastSubTime: isOnPitch ? 0 : null,
        currentStintMinutes: 0,
      });
    });

    setPlayerStatuses(statusMap);
    
    // Try to load from storage
    loadFromStorage();
  }, [players, initialOnPitchIds]);

  // Update player times based on match duration
  useEffect(() => {
    setPlayerStatuses(prev => {
      const updated = new Map(prev);
      
      updated.forEach((status, playerId) => {
        if (status.isOnPitch) {
          const lastSubSeconds = status.lastSubTime ?? 0;
          const currentStintSeconds = matchDuration - lastSubSeconds;
          const currentStintMinutes = Math.floor(currentStintSeconds / 60);
          
          updated.set(playerId, {
            ...status,
            minutesPlayed: Math.floor((status.minutesPlayed * 60 + currentStintSeconds) / 60),
            currentStintMinutes,
          });
        }
      });
      
      return updated;
    });
  }, [matchDuration]);

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    try {
      const data = {
        playerStatuses: Array.from(playerStatuses.entries()),
        substitutions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save substitution state:', error);
    }
  }, [playerStatuses, substitutions]);

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.playerStatuses) {
          setPlayerStatuses(new Map(data.playerStatuses));
        }
        if (data.substitutions) {
          setSubstitutions(data.substitutions);
        }
      }
    } catch (error) {
      console.warn('Failed to load substitution state:', error);
    }
  }, []);

  // Execute a substitution
  const executeSubstitution = useCallback((playerOutId: string, playerInId: string) => {
    const playerOut = playerStatuses.get(playerOutId);
    const playerIn = playerStatuses.get(playerInId);

    if (!playerOut || !playerIn) {
      console.error('Invalid player IDs for substitution');
      return;
    }

    // Validate: one must be on pitch, one must be on bench
    if (playerOut.isOnPitch === playerIn.isOnPitch) {
      console.warn('Invalid substitution: both players on same zone');
      return;
    }

    const now = Date.now();
    const matchMinute = matchDuration;

    // Create substitution record
    const sub: Substitution = {
      id: `sub-${now}`,
      timestamp: now,
      playerOut: playerOut.isOnPitch ? playerOutId : playerInId,
      playerOutName: playerOut.isOnPitch ? playerOut.playerName : playerIn.playerName,
      playerIn: playerOut.isOnPitch ? playerInId : playerOutId,
      playerInName: playerOut.isOnPitch ? playerIn.playerName : playerOut.playerName,
      matchMinute,
    };

    // Update player statuses
    setPlayerStatuses(prev => {
      const updated = new Map(prev);
      
      // Swap positions
      const outPlayer = updated.get(playerOutId)!;
      const inPlayer = updated.get(playerInId)!;
      
      updated.set(playerOutId, {
        ...outPlayer,
        isOnPitch: !outPlayer.isOnPitch,
        lastSubTime: !outPlayer.isOnPitch ? matchMinute : outPlayer.lastSubTime,
        currentStintMinutes: !outPlayer.isOnPitch ? 0 : outPlayer.currentStintMinutes,
      });
      
      updated.set(playerInId, {
        ...inPlayer,
        isOnPitch: !inPlayer.isOnPitch,
        lastSubTime: !inPlayer.isOnPitch ? matchMinute : inPlayer.lastSubTime,
        currentStintMinutes: !inPlayer.isOnPitch ? 0 : inPlayer.currentStintMinutes,
      });
      
      return updated;
    });

    setSubstitutions(prev => [...prev, sub]);
    saveToStorage();
  }, [playerStatuses, matchDuration, saveToStorage]);

  // Handle player tap (two-tap system)
  const handlePlayerTap = useCallback((playerId: string) => {
    if (!selectedPlayer) {
      // First tap: select player
      setSelectedPlayer(playerId);
    } else {
      // Second tap: execute swap if valid
      if (selectedPlayer !== playerId) {
        executeSubstitution(selectedPlayer, playerId);
      }
      setSelectedPlayer(null);
    }
  }, [selectedPlayer, executeSubstitution]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  // Get players on pitch
  const getPlayersOnPitch = useCallback(() => {
    return Array.from(playerStatuses.values()).filter(p => p.isOnPitch);
  }, [playerStatuses]);

  // Get players on bench
  const getPlayersOnBench = useCallback(() => {
    return Array.from(playerStatuses.values()).filter(p => !p.isOnPitch);
  }, [playerStatuses]);

  // Clear storage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear substitution state:', error);
    }
  }, []);

  return {
    playerStatuses,
    substitutions,
    selectedPlayer,
    handlePlayerTap,
    cancelSelection,
    getPlayersOnPitch,
    getPlayersOnBench,
    executeSubstitution,
    clearStorage,
  };
}

