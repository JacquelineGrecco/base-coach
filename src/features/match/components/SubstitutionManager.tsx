'use client';

import React from 'react';
import { Users, AlertCircle, X } from 'lucide-react';
import { PlayerStatus } from '../hooks/useSubstitutions';
import { useFatigueTracker } from '../hooks/useFatigueTracker';

interface SubstitutionManagerProps {
  playerStatuses: Map<string, PlayerStatus>;
  selectedPlayer: string | null;
  onPlayerTap: (playerId: string) => void;
  onCancelSelection: () => void;
  matchDuration: number;
}

/**
 * Live substitution manager with two-tap system
 * Displays players on pitch and on bench with fatigue indicators
 */
export function SubstitutionManager({
  playerStatuses,
  selectedPlayer,
  onPlayerTap,
  onCancelSelection,
  matchDuration,
}: SubstitutionManagerProps) {
  const { getFatigueLevel, getFatigueBarClasses, getFatiguePercentage } = useFatigueTracker(
    playerStatuses,
    matchDuration
  );

  // Separate players into on-pitch and bench
  const playersOnPitch = Array.from(playerStatuses.values()).filter(p => p.isOnPitch);
  const playersOnBench = Array.from(playerStatuses.values()).filter(p => !p.isOnPitch);

  const renderPlayerCard = (player: PlayerStatus, zone: 'pitch' | 'bench') => {
    const fatigue = getFatigueLevel(player.playerId);
    const isSelected = selectedPlayer === player.playerId;
    const isOnPitch = zone === 'pitch';
    
    // Determine if this card should be highlighted (selected or valid for swap)
    const canSwap = selectedPlayer && 
      selectedPlayer !== player.playerId && 
      playerStatuses.get(selectedPlayer)?.isOnPitch !== player.isOnPitch;

    return (
      <button
        key={player.playerId}
        onClick={() => onPlayerTap(player.playerId)}
        className={`
          ${isOnPitch ? 'h-24' : 'h-20'} 
          w-full p-3 rounded-xl 
          bg-white border-2
          transition-all duration-200 
          active:scale-95
          ${isSelected ? 'ring-4 ring-blue-500 border-blue-500 shadow-lg' : 'border-slate-200'}
          ${canSwap ? 'ring-2 ring-green-400 border-green-400' : ''}
          hover:shadow-md
        `}
      >
        {/* Player Name and Jersey */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {player.jerseyNumber && (
              <span className="text-lg font-bold text-slate-700 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center">
                {player.jerseyNumber}
              </span>
            )}
            <span className="font-semibold text-slate-900 text-left">
              {player.playerName}
            </span>
          </div>
          {fatigue.shouldAlert && isOnPitch && (
            <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
          )}
        </div>

        {/* Fatigue Bar (only for players on pitch) */}
        {isOnPitch && (
          <>
            <div className="w-full bg-slate-200 h-2 rounded-full mb-2 overflow-hidden">
              <div
                className={getFatigueBarClasses(player.playerId)}
                style={{ width: `${getFatiguePercentage(player.playerId)}%` }}
              />
            </div>

            {/* Time Metrics */}
            <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
              <span>Total: {fatigue.totalMinutes}min</span>
              <span className={fatigue.shouldAlert ? 'text-orange-600 font-bold' : ''}>
                Atual: {fatigue.currentStintMinutes}min
              </span>
            </div>
          </>
        )}

        {/* Bench player - show total minutes only */}
        {!isOnPitch && player.minutesPlayed > 0 && (
          <div className="text-xs text-slate-500 tabular-nums mt-1">
            Jogou: {player.minutesPlayed}min
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Selection Banner */}
      {selectedPlayer && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {playerStatuses.get(selectedPlayer)?.playerName} selecionado
              </p>
              <p className="text-xs text-blue-700">
                {playerStatuses.get(selectedPlayer)?.isOnPitch 
                  ? 'Toque em um jogador do banco para substituir'
                  : 'Toque em um jogador em campo para substituir'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelSelection}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      )}

      {/* On-Pitch Zone */}
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <h3 className="font-bold text-slate-900 text-lg">
            Em Campo ({playersOnPitch.length})
          </h3>
        </div>
        
        {playersOnPitch.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum jogador em campo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playersOnPitch.map(player => renderPlayerCard(player, 'pitch'))}
          </div>
        )}
      </div>

      {/* Bench Zone */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-slate-500 rounded-full" />
          <h3 className="font-bold text-slate-900 text-lg">
            No Banco ({playersOnBench.length})
          </h3>
        </div>
        
        {playersOnBench.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Todos os jogadores estão em campo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playersOnBench.map(player => renderPlayerCard(player, 'bench'))}
          </div>
        )}
      </div>
    </div>
  );
}

