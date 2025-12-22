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
    <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border-4 border-slate-700">
      {/* Header with Clock Icon */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-8 h-8 text-yellow-400" />
        <span className="text-slate-300 font-medium tracking-wide">TEMPO DE JOGO</span>
      </div>

      {/* Main Timer Display */}
      <div className="flex items-center justify-center mb-6">
        <div 
          className={`
            text-8xl md:text-9xl font-bold text-yellow-400 
            tabular-nums tracking-tight
            ${!isPaused ? 'animate-pulse' : ''}
          `}
        >
          {formattedTime}
        </div>
      </div>

      {/* Play/Pause Button */}
      <div className="flex justify-center">
        <button
          onClick={onToggle}
          className="
            h-16 px-12 
            bg-yellow-400 hover:bg-yellow-500 
            text-slate-900 font-bold text-lg
            rounded-xl 
            transition-all duration-200 
            active:scale-95
            shadow-lg hover:shadow-xl
            flex items-center gap-3
          "
        >
          {isPaused ? (
            <>
              <Play className="w-6 h-6 fill-current" />
              <span>Iniciar</span>
            </>
          ) : (
            <>
              <Pause className="w-6 h-6 fill-current" />
              <span>Pausar</span>
            </>
          )}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div 
          className={`
            w-3 h-3 rounded-full
            ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}
          `}
        />
        <span className="text-slate-400 text-sm font-medium">
          {isPaused ? 'Pausado' : 'Em Andamento'}
        </span>
      </div>
    </div>
  );
}

