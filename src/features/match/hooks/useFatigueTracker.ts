import { useMemo } from 'react';
import { PlayerStatus } from './useSubstitutions';

export type FatigueLevel = 'fresh' | 'moderate' | 'tired';
export type FatigueColor = 'green' | 'yellow' | 'orange';

export interface FatigueInfo {
  playerId: string;
  level: FatigueLevel;
  color: FatigueColor;
  currentStintMinutes: number;
  totalMinutes: number;
  shouldAlert: boolean; // true if > 20 minutes
}

/**
 * Custom hook to track player fatigue levels based on playing time
 * Alerts coaches when players exceed recommended continuous play time
 */
export function useFatigueTracker(
  playerStatuses: Map<string, PlayerStatus>,
  matchDuration: number
) {
  // Calculate fatigue level for a specific player
  const getFatigueLevel = useMemo(() => {
    return (playerId: string): FatigueInfo => {
      const status = playerStatuses.get(playerId);
      
      if (!status) {
        return {
          playerId,
          level: 'fresh',
          color: 'green',
          currentStintMinutes: 0,
          totalMinutes: 0,
          shouldAlert: false,
        };
      }

      // Only track fatigue for players currently on pitch
      if (!status.isOnPitch) {
        return {
          playerId,
          level: 'fresh',
          color: 'green',
          currentStintMinutes: 0,
          totalMinutes: status.minutesPlayed,
          shouldAlert: false,
        };
      }

      const minutes = status.currentStintMinutes;
      
      // Determine fatigue level based on continuous play time
      let level: FatigueLevel = 'fresh';
      let color: FatigueColor = 'green';
      let shouldAlert = false;

      if (minutes > 20) {
        level = 'tired';
        color = 'orange';
        shouldAlert = true;
      } else if (minutes > 15) {
        level = 'moderate';
        color = 'yellow';
        shouldAlert = false;
      }

      return {
        playerId,
        level,
        color,
        currentStintMinutes: minutes,
        totalMinutes: status.minutesPlayed,
        shouldAlert,
      };
    };
  }, [playerStatuses]);

  // Get all players with high fatigue (> 20 min)
  const getHighFatiguePlayers = useMemo(() => {
    const highFatigue: FatigueInfo[] = [];
    
    playerStatuses.forEach((status, playerId) => {
      const fatigue = getFatigueLevel(playerId);
      if (fatigue.shouldAlert) {
        highFatigue.push(fatigue);
      }
    });
    
    return highFatigue;
  }, [playerStatuses, getFatigueLevel]);

  // Get Tailwind classes for fatigue bar
  const getFatigueBarClasses = (playerId: string): string => {
    const fatigue = getFatigueLevel(playerId);
    
    const baseClasses = 'h-2 rounded-full transition-all duration-300';
    
    switch (fatigue.color) {
      case 'green':
        return `${baseClasses} bg-green-500`;
      case 'yellow':
        return `${baseClasses} bg-yellow-400`;
      case 'orange':
        return `${baseClasses} bg-orange-500 animate-pulse`;
      default:
        return `${baseClasses} bg-slate-300`;
    }
  };

  // Get fatigue percentage (0-100) based on 30 min max
  const getFatiguePercentage = (playerId: string): number => {
    const fatigue = getFatigueLevel(playerId);
    return Math.min((fatigue.currentStintMinutes / 30) * 100, 100);
  };

  return {
    getFatigueLevel,
    getHighFatiguePlayers,
    getFatigueBarClasses,
    getFatiguePercentage,
  };
}


