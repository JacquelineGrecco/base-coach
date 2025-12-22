'use client';

import React, { useState, useEffect } from 'react';
import { Evaluation } from '@/types';
import { VALENCES } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Save, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMatchTimer, useEvaluationManager, useSwipeGesture } from '@/features/match/hooks';
import { useSubstitutions } from '@/features/match/hooks/useSubstitutions';
import { MatchClock } from './MatchClock';
import { SubstitutionManager } from './SubstitutionManager';
import { SidelineActions, SessionNote, MatchScore } from './SidelineActions';
import { SessionSummary } from './SessionSummary';

interface ActiveSessionProps {
  teamId: string;
  categoryId: string | null;
  selectedValenceIds: string[];
  presentPlayerIds: string[];
  onEndSession: (evaluations: Evaluation[]) => void;
  onCancel: () => void;
}

interface DbPlayer {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
}

type ViewMode = 'live' | 'summary';

const ActiveSession: React.FC<ActiveSessionProps> = ({ 
  teamId, 
  categoryId, 
  selectedValenceIds,
  presentPlayerIds, 
  onEndSession, 
  onCancel 
}) => {
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [matchScore, setMatchScore] = useState<MatchScore>({
    teamScore: 0,
    opponentScore: 0,
    goals: [],
  });
  
  const sessionId = `session-${Date.now()}`;
  
  // Use custom hooks for timer, evaluations, substitutions, and swipe gestures
  const timer = useMatchTimer(true);
  const evaluationManager = useEvaluationManager(players, sessionId);
  const substitutions = useSubstitutions(players, timer.duration, presentPlayerIds);
  
  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, [teamId, categoryId, presentPlayerIds]);

  async function loadPlayers() {
    setLoading(true);
    try {
      let query = supabase
        .from('players')
        .select('id, name, position, jersey_number')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .in('id', presentPlayerIds)
        .order('jersey_number', { ascending: true, nullsFirst: false })
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
    }
    setLoading(false);
  }

  // Filter valences to show only selected ones
  const activeValences = VALENCES.filter(v => selectedValenceIds.includes(v.id));
  
  // Setup swipe gestures for player navigation
  const swipeHandlers = useSwipeGesture(
    evaluationManager.nextPlayer,
    evaluationManager.previousPlayer
  );

  const currentPlayer = evaluationManager.currentPlayer;
  const currentEvaluation = evaluationManager.getPlayerEvaluation(currentPlayer?.id || '');

  const handleScore = (valenceId: string, score: number) => {
    if (!currentPlayer) return;
    evaluationManager.setScore(currentPlayer.id, valenceId, score);
  };

  // Sideline Actions Handlers
  const handleGoalFor = () => {
    setMatchScore(prev => ({
      ...prev,
      teamScore: prev.teamScore + 1,
      goals: [...prev.goals, {
        timestamp: Date.now(),
        matchMinute: timer.duration,
        type: 'for',
      }],
    }));
  };

  const handleGoalAgainst = () => {
    setMatchScore(prev => ({
      ...prev,
      opponentScore: prev.opponentScore + 1,
      goals: [...prev.goals, {
        timestamp: Date.now(),
        matchMinute: timer.duration,
        type: 'against',
      }],
    }));
  };

  const handleAddNote = (note: Omit<SessionNote, 'id' | 'timestamp' | 'matchMinute'>) => {
    const newNote: SessionNote = {
      ...note,
      id: `note-${Date.now()}`,
      timestamp: Date.now(),
      matchMinute: timer.duration,
    };
    setSessionNotes(prev => [...prev, newNote]);
  };

  const handleFinishSession = () => {
    // Check if all players have been evaluated
    const unevaluatedPlayers = evaluationManager.unevaluatedPlayers;

    if (unevaluatedPlayers.length > 0) {
      const playerNames = unevaluatedPlayers.map(p => p.name).join(', ');
      const message = unevaluatedPlayers.length === 1
        ? `O atleta ${playerNames} ainda não foi avaliado.\n\nDeseja finalizar a sessão mesmo assim?`
        : `Os atletas ${playerNames} ainda não foram avaliados.\n\nDeseja finalizar a sessão mesmo assim?`;
      
      if (!window.confirm(message)) {
        return;
      }
    }

    // Move to summary view
    timer.pause();
    setViewMode('summary');
  };

  const handleSaveAndExit = (aiReport?: string) => {
    // Clear localStorage
    evaluationManager.clearLocalStorage();
    substitutions.clearStorage();
    timer.reset();
    
    // TODO: Save session data including substitutions, notes, and AI report to database
    console.log('Session data:', {
      evaluations: evaluationManager.evaluations,
      substitutions: substitutions.substitutions,
      notes: sessionNotes,
      matchScore,
      aiReport,
    });
    
    onEndSession(evaluationManager.evaluations);
  };

  const handleGoToDashboard = () => {
    if (window.confirm('Tem certeza que deseja voltar ao dashboard? Os dados da sessão não serão salvos.')) {
      evaluationManager.clearLocalStorage();
      substitutions.clearStorage();
      timer.reset();
      onCancel();
    }
  };

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando atletas...</p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum atleta encontrado</h3>
          <p className="text-slate-600 mb-6">
            Não há atletas ativos neste time/categoria para avaliar.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show summary view
  if (viewMode === 'summary') {
    const playerStatusesForSummary = new Map(
      Array.from(substitutions.playerStatuses.entries()).map(([id, status]) => [
        id,
        {
          playerName: status.playerName,
          minutesPlayed: status.minutesPlayed,
        },
      ])
    );

    return (
      <SessionSummary
        duration={timer.duration}
        teamScore={matchScore.teamScore}
        opponentScore={matchScore.opponentScore}
        substitutions={substitutions.substitutions}
        notes={sessionNotes}
        playerStatuses={playerStatusesForSummary}
        onSaveAndExit={handleSaveAndExit}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Render logic - currentPlayer should exist at this point
  if (!currentPlayer || !currentEvaluation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar atleta</h3>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Bar: Match Clock & Session Controls */}
      <div className="bg-white border-b-2 border-slate-200 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Sessão ao Vivo</h2>
            <div className="flex gap-2">
              <button 
                onClick={onCancel}
                className="h-12 px-6 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinishSession}
                className="h-12 px-6 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center transition-all duration-200 active:scale-95 hover:scale-105"
              >
                <Save className="w-5 h-5 mr-2" />
                Finalizar Sessão
              </button>
            </div>
          </div>
          
          {/* Match Clock */}
          <MatchClock
            duration={timer.duration}
            isPaused={timer.isPaused}
            formattedTime={timer.formattedTime}
            onToggle={timer.toggle}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-32" {...swipeHandlers}>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Substitution Manager */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Gestão de Substituições</h3>
            <SubstitutionManager
              playerStatuses={substitutions.playerStatuses}
              selectedPlayer={substitutions.selectedPlayer}
              onPlayerTap={substitutions.handlePlayerTap}
              onCancelSelection={substitutions.cancelSelection}
              matchDuration={timer.duration}
            />
          </div>

          {/* Player Evaluation Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Avaliação de Atletas</h3>
              
              {/* Player Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={evaluationManager.previousPlayer}
                  disabled={evaluationManager.currentPlayerIndex === 0}
                  className="h-12 w-12 rounded-full hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <ChevronLeft className="w-8 h-8 text-gray-700" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-100 bg-blue-100 flex items-center justify-center shadow-sm">
                      <span className="text-blue-700 font-bold text-2xl">
                        {currentPlayer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {currentPlayer.jersey_number && (
                      <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        #{currentPlayer.jersey_number}
                      </div>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">{currentPlayer.name}</h2>
                  {currentPlayer.position && (
                    <p className="text-sm text-slate-500">{currentPlayer.position}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {evaluationManager.currentPlayerIndex + 1} de {players.length}
                  </p>
                </div>

                <button 
                  onClick={evaluationManager.nextPlayer}
                  disabled={evaluationManager.currentPlayerIndex === players.length - 1}
                  className="h-12 w-12 rounded-full hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <ChevronRight className="w-8 h-8 text-gray-700" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${evaluationManager.progress}%` }}></div>
              </div>

              {/* Scoring Area */}
              <div className={`grid gap-6 ${activeValences.length === 1 ? 'grid-cols-1' : activeValences.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                {activeValences.map((valence) => (
                  <div key={valence.id} className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-base text-gray-900">{valence.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        valence.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                        valence.category === 'Physical' ? 'bg-red-100 text-red-800' :
                        valence.category === 'Tactical' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {valence.category}
                      </span>
                    </div>
                    
                    {/* Score Buttons */}
                    <div className="grid grid-cols-6 gap-2">
                      {[0, 1, 2, 3, 4, 5].map((score) => {
                        const isSelected = currentEvaluation?.scores[valence.id] === score;
                        return (
                          <button
                            key={score}
                            onClick={() => handleScore(valence.id, score)}
                            className={`
                              h-14 rounded-lg font-bold text-xl transition-all duration-150 transform
                              ${isSelected 
                                ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300' 
                                : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 hover:scale-105 active:scale-95'
                              }
                            `}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Player Notes */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Observações do Atleta</h4>
                </div>
                <textarea
                  value={evaluationManager.getPlayerNote(currentPlayer.id)}
                  onChange={(e) => evaluationManager.setPlayerNote(currentPlayer.id, e.target.value)}
                  placeholder="Adicione observações específicas sobre este atleta..."
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Sideline Actions */}
      <SidelineActions
        matchScore={matchScore}
        onGoalFor={handleGoalFor}
        onGoalAgainst={handleGoalAgainst}
        onAddNote={handleAddNote}
        matchDuration={timer.duration}
        players={players.map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
};

export default ActiveSession;
