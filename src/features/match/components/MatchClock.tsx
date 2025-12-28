'use client';

import React from 'react';
import { Clock, Play, Pause } from 'lucide-react';

interface MatchClockProps {
  duration: number;
  isPaused: boolean;
  formattedTime: string;
  onToggle: () => void;
}

/**
 * High-contrast match clock optimized for outdoor/sideline use
 * Features bright yellow text on dark background for maximum visibility
 */
export function MatchClock({ duration, isPaused, formattedTime, onToggle }: MatchClockProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-3 shadow-lg border-2 border-slate-700">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-300 text-xs font-medium">TEMPO DE JOGO</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className={`
              w-2 h-2 rounded-full
              ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}
            `}
          />
          <span className="text-slate-400 text-xs">
            {isPaused ? 'Pausado' : 'Em Andamento'}
          </span>
        </div>
      </div>

      {/* Compact Timer Display */}
      <div className="flex items-center justify-between">
        <div 
          className={`
            text-3xl font-bold text-yellow-400 
            tabular-nums tracking-tight
            ${!isPaused ? 'animate-pulse' : ''}
          `}
        >
          {formattedTime}
        </div>

        {/* Compact Play/Pause Button */}
        <button
          onClick={onToggle}
          className="
            h-8 px-4 
            bg-yellow-400 hover:bg-yellow-500 
            text-slate-900 font-semibold text-xs
            rounded-lg 
            transition-all duration-200 
            active:scale-95
            shadow-md hover:shadow-lg
            flex items-center gap-1.5
          "
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Iniciar</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>Pausar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


