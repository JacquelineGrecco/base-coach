'use client';

import React, { useState } from 'react';
import { Target, TrendingDown, FileText, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export interface SessionNote {
  id: string;
  timestamp: number;
  matchMinute: number;
  type: 'player' | 'session';
  playerId?: string;
  playerName?: string;
  content: string;
}

export interface MatchScore {
  teamScore: number;
  opponentScore: number;
  goals: Array<{
    timestamp: number;
    matchMinute: number;
    type: 'for' | 'against';
  }>;
}

interface SidelineActionsProps {
  matchScore: MatchScore;
  onGoalFor: () => void;
  onGoalAgainst: () => void;
  onAddNote: (note: Omit<SessionNote, 'id' | 'timestamp' | 'matchMinute'>) => void;
  matchDuration: number;
  players: Array<{ id: string; name: string }>;
}

/**
 * Fixed bottom bar with quick sideline actions
 * Large buttons optimized for thumb access during live play
 */
export function SidelineActions({
  matchScore,
  onGoalFor,
  onGoalAgainst,
  onAddNote,
  matchDuration,
  players,
}: SidelineActionsProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteType, setNoteType] = useState<'player' | 'session'>('session');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');

  const handleOpenNoteModal = () => {
    setShowNoteModal(true);
    setNoteContent('');
    setNoteType('session');
    setSelectedPlayerId('');
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    const player = players.find(p => p.id === selectedPlayerId);
    
    onAddNote({
      type: noteType,
      playerId: noteType === 'player' ? selectedPlayerId : undefined,
      playerName: noteType === 'player' ? player?.name : undefined,
      content: noteContent.trim(),
    });

    setShowNoteModal(false);
    setNoteContent('');
    setSelectedPlayerId('');
  };

  return (
    <>
      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-200 shadow-2xl z-40">
        <div className="max-w-4xl mx-auto p-4">
          {/* Score Display */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-4 bg-slate-100 rounded-xl px-6 py-2">
              <span className="text-2xl font-bold tabular-nums text-green-600">
                {matchScore.teamScore}
              </span>
              <span className="text-slate-400 font-medium">×</span>
              <span className="text-2xl font-bold tabular-nums text-red-600">
                {matchScore.opponentScore}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Goal For */}
            <button
              onClick={onGoalFor}
              className="
                h-16 
                bg-green-600 hover:bg-green-700 
                text-white font-bold 
                rounded-xl 
                transition-all duration-200 
                active:scale-95
                shadow-lg
                flex flex-col items-center justify-center gap-1
              "
            >
              <Target className="w-6 h-6" />
              <span className="text-sm">Gol Pró</span>
            </button>

            {/* Goal Against */}
            <button
              onClick={onGoalAgainst}
              className="
                h-16 
                bg-red-600 hover:bg-red-700 
                text-white font-bold 
                rounded-xl 
                transition-all duration-200 
                active:scale-95
                shadow-lg
                flex flex-col items-center justify-center gap-1
              "
            >
              <TrendingDown className="w-6 h-6" />
              <span className="text-sm">Gol Contra</span>
            </button>

            {/* Quick Note */}
            <button
              onClick={handleOpenNoteModal}
              className="
                h-16 
                bg-blue-600 hover:bg-blue-700 
                text-white font-bold 
                rounded-xl 
                transition-all duration-200 
                active:scale-95
                shadow-lg
                flex flex-col items-center justify-center gap-1
              "
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">Nota Rápida</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Adicionar Nota Rápida"
      >
        <div className="space-y-4">
          {/* Match Time Display */}
          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <span className="text-sm text-slate-600">Tempo de Jogo:</span>
            <span className="ml-2 text-lg font-bold text-slate-900 tabular-nums">
              {Math.floor(matchDuration / 60)}:{(matchDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Note Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Nota
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNoteType('session')}
                className={`
                  h-12 px-4 rounded-lg font-medium transition-all
                  ${noteType === 'session' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                `}
              >
                Nota da Sessão
              </button>
              <button
                onClick={() => setNoteType('player')}
                className={`
                  h-12 px-4 rounded-lg font-medium transition-all
                  ${noteType === 'player' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                `}
              >
                Nota do Atleta
              </button>
            </div>
          </div>

          {/* Player Selection (only if player note) */}
          {noteType === 'player' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Selecionar Atleta
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="
                  w-full h-12 px-4 rounded-lg 
                  border-2 border-slate-200 
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                  transition-all
                "
              >
                <option value="">Escolha um atleta...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Conteúdo da Nota
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={noteType === 'player' 
                ? 'Ex: Ótimo posicionamento defensivo nesta jogada'
                : 'Ex: Forte pressão da defesa aos 15min'}
              rows={4}
              className="
                w-full px-4 py-3 rounded-lg 
                border-2 border-slate-200 
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                transition-all
                resize-none
              "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowNoteModal(false)}
              className="
                flex-1 h-12 
                bg-slate-100 hover:bg-slate-200 
                text-slate-700 font-medium 
                rounded-lg 
                transition-all
              "
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || (noteType === 'player' && !selectedPlayerId)}
              className="
                flex-1 h-12 
                bg-blue-600 hover:bg-blue-700 
                disabled:bg-slate-300 disabled:cursor-not-allowed
                text-white font-bold 
                rounded-lg 
                transition-all
              "
            >
              Salvar Nota
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

