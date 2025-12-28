'use client';

import React, { useState, useEffect } from 'react';
import { Evaluation } from '@/types';
import { VALENCES } from '@/lib/constants';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMatchTimer, useEvaluationManager } from '@/features/match/hooks';
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

  const handleScore = (playerId: string, valenceId: string, score: number) => {
    evaluationManager.setScore(playerId, valenceId, score);
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


  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar: Compact Header with Clock & Controls */}
      <div className="bg-white border-b-2 border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto p-4">
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
          
          {/* Compact Match Clock */}
          <div className="max-w-md">
            <MatchClock
              duration={timer.duration}
              isPaused={timer.isPaused}
              formattedTime={timer.formattedTime}
              onToggle={timer.toggle}
            />
          </div>
        </div>
      </div>

      {/* Main Evaluation Area - Valences First, Then All Players */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          
          {/* Progress Bar - Overall Progress */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4 mb-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span className="font-semibold">Progresso Geral</span>
              <span className="font-bold text-blue-600">{evaluationManager.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${evaluationManager.progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {evaluationManager.evaluatedCount} de {players.length} atletas avaliados
            </div>
          </div>

          {/* Valences - Each valence shows all players */}
          <div className="space-y-6">
            {activeValences.map((valence) => {
              return (
                <div key={valence.id} className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6">
                  {/* Valence Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-2xl text-slate-900 mb-1">{valence.name}</h3>
                      <p className="text-sm text-slate-500">Avalie todos os atletas para esta valência</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                      valence.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                      valence.category === 'Physical' ? 'bg-red-100 text-red-800' :
                      valence.category === 'Tactical' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {valence.category}
                    </span>
                  </div>
                  
                  {/* Players Grid - All players for this valence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => {
                      const playerEvaluation = evaluationManager.getPlayerEvaluation(player.id);
                      const currentScore = playerEvaluation?.scores[valence.id] ?? null;
                      
                      return (
                        <div 
                          key={player.id} 
                          className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all"
                        >
                          {/* Player Info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                                <span className="text-blue-700 font-bold text-sm">
                                  {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              {player.jersey_number && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                  #{player.jersey_number}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm truncate">{player.name}</h4>
                              {player.position && (
                                <p className="text-xs text-slate-500">{player.position}</p>
                              )}
                            </div>
                            {currentScore !== null && (
                              <div className="bg-blue-600 text-white text-lg font-bold w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                {currentScore}
                              </div>
                            )}
                          </div>
                          
                          {/* Score Buttons - Compact */}
                          <div className="grid grid-cols-6 gap-1.5">
                            {[0, 1, 2, 3, 4, 5].map((score) => {
                              const isSelected = currentScore === score;
                              return (
                                <button
                                  key={score}
                                  onClick={() => handleScore(player.id, valence.id, score)}
                                  className={`
                                    h-10 rounded-lg font-bold text-base transition-all duration-150 transform
                                    ${isSelected 
                                      ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300' 
                                      : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:scale-105 active:scale-95 shadow-sm'
                                    }
                                  `}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActiveSession;


