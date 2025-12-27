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
      // Check session before making the query
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when loading players for active session');
        alert('Sessão expirada. Por favor, recarregue a página.');
        setLoading(false);
        return;
      }

      console.log('ActiveSession - Loading players:', {
        teamId,
        categoryId,
        presentPlayerIds,
        count: presentPlayerIds.length
      });

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

      if (error) {
        console.error('Error loading players in ActiveSession:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log('ActiveSession - Players loaded:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No players found for active session!', {
          teamId,
          presentPlayerIds,
        });
        alert('Nenhum atleta encontrado. Verifique se os atletas selecionados existem e estão ativos.');
      }
      
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error loading players:', error);
      
      // Show more specific error message
      if (error.message?.includes('session') || error.message?.includes('JWT')) {
        alert('Sessão expirada. Por favor, recarregue a página e faça login novamente.');
      } else {
        alert('Erro ao carregar atletas: ' + (error.message || 'Erro desconhecido'));
      }
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

  // Debug logging
  console.log('ActiveSession - Render check:', {
    loading,
    playersCount: players.length,
    currentPlayer: currentPlayer?.name || 'null',
    currentPlayerIndex: evaluationManager.currentPlayerIndex,
    hasEvaluation: !!currentEvaluation,
  });

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
  // Note: currentEvaluation can be null at the start (no scores yet)
  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar atletas</h3>
          <p className="text-slate-600 mb-4">
            Não foi possível carregar as informações dos atletas.
          </p>
          <div className="space-y-2">
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Debug: {players.length} atleta(s) carregado(s), mas currentPlayer é null
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar: Clock & Controls */}
      <div className="bg-white border-b-2 border-slate-200 shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-900">Sessão ao Vivo</h2>
            <div className="flex gap-2">
              <button 
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinishSession}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                Finalizar
              </button>
            </div>
          </div>
          
          {/* Match Clock - Centered */}
          <MatchClock
            duration={timer.duration}
            isPaused={timer.isPaused}
            formattedTime={timer.formattedTime}
            onToggle={timer.toggle}
          />
        </div>
      </div>

      {/* Main Evaluation Area - Full Focus */}
      <div className="flex-1 overflow-y-auto" {...swipeHandlers}>
        <div className="max-w-4xl mx-auto p-6">
          
          {/* Player Card - Prominent */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-8 mb-6">
            
            {/* Player Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={evaluationManager.previousPlayer}
                disabled={evaluationManager.currentPlayerIndex === 0}
                className="h-14 w-14 rounded-full hover:bg-slate-100 disabled:opacity-20 flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-10 h-10 text-slate-700" />
              </button>

              {/* Current Player Display */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
                    <span className="text-blue-700 font-bold text-3xl">
                      {currentPlayer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {currentPlayer.jersey_number && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                      #{currentPlayer.jersey_number}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentPlayer.name}</h2>
                {currentPlayer.position && (
                  <p className="text-base text-slate-500 mb-2">{currentPlayer.position}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="font-semibold">{evaluationManager.currentPlayerIndex + 1}</span>
                  <span>/</span>
                  <span>{players.length}</span>
                </div>
              </div>

              <button 
                onClick={evaluationManager.nextPlayer}
                disabled={evaluationManager.currentPlayerIndex === players.length - 1}
                className="h-14 w-14 rounded-full hover:bg-slate-100 disabled:opacity-20 flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-10 h-10 text-slate-700" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Progresso</span>
                <span className="font-semibold">{evaluationManager.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${evaluationManager.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Valence Scoring - Large & Clear */}
            <div className="space-y-6">
              {activeValences.map((valence) => (
                <div key={valence.id} className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-slate-900">{valence.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      valence.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                      valence.category === 'Physical' ? 'bg-red-100 text-red-800' :
                      valence.category === 'Tactical' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {valence.category}
                    </span>
                  </div>
                  
                  {/* Score Buttons - Larger for easy tapping */}
                  <div className="grid grid-cols-6 gap-3">
                    {[0, 1, 2, 3, 4, 5].map((score) => {
                      const isSelected = currentEvaluation?.scores[valence.id] === score;
                      return (
                        <button
                          key={score}
                          onClick={() => handleScore(valence.id, score)}
                          className={`
                            h-16 rounded-xl font-bold text-2xl transition-all duration-150 transform
                            ${isSelected 
                              ? 'bg-blue-600 text-white shadow-xl scale-110 ring-4 ring-blue-300' 
                              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:scale-105 active:scale-95 shadow-md'
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
          </div>

          {/* Quick Actions - Compact at Bottom */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setViewMode('summary')}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
              >
                📊 Ver Resumo
              </button>
              <button
                onClick={() => {/* TODO: Open substitutions modal */}}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
              >
                🔄 Substituições
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActiveSession;


