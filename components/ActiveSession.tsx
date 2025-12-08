import React, { useState, useMemo, useEffect } from 'react';
import { Evaluation } from '../types';
import { VALENCES } from '../constants';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Clock, AlertCircle, Pause, Play, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ActiveSessionProps {
  teamId: string;
  categoryId: string | null;
  selectedValenceIds: string[];
  onEndSession: (evaluations: Evaluation[]) => void;
  onCancel: () => void;
}

interface DbPlayer {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ 
  teamId, 
  categoryId, 
  selectedValenceIds, 
  onEndSession, 
  onCancel 
}) => {
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [playerNotes, setPlayerNotes] = useState<{[playerId: string]: string}>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, [teamId, categoryId]);

  async function loadPlayers() {
    setLoading(true);
    try {
      let query = supabase
        .from('players')
        .select('id, name, position, jersey_number')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true, nullsFirst: false })
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else if (categoryId === null) {
        // Load all players regardless of category
        // Don't filter by category_id
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error loading players:', error);
    }
    setLoading(false);
  }

  // Filter valences to show only selected ones
  const activeValences = VALENCES.filter(v => selectedValenceIds.includes(v.id));
  
  // Swipe detection constants
  const minSwipeDistance = 50;
  
  // Timer with pause/resume
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Keyboard navigation for faster workflow
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

  // Swipe gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else if (isRightSwipe && currentPlayerIndex > 0) {
      setCurrentPlayerIndex(prev => prev - 1);
    }
  };

  // Calculate currentPlayer and evaluation (must be before conditional returns)
  const currentPlayer = players[currentPlayerIndex];
  
  // Get existing evaluation for current player or create blank
  const currentEvaluation = useMemo(() => {
    if (!currentPlayer) return null;
    return evaluations.find(e => e.playerId === currentPlayer.id) || {
      playerId: currentPlayer.id,
      sessionId: 'temp-session',
      scores: {},
      timestamp: Date.now()
    };
  }, [evaluations, currentPlayer?.id, currentPlayer]);

  const handleScore = (valenceId: string, score: number) => {
    if (!currentPlayer || !currentEvaluation) return;
    
    setEvaluations(prev => {
      const otherEvals = prev.filter(e => e.playerId !== currentPlayer.id);
      const newScores = { ...currentEvaluation.scores, [valenceId]: score };
      const updatedEval = { ...currentEvaluation, scores: newScores };
      return [...otherEvals, updatedEval];
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.round(((currentPlayerIndex + 1) / players.length) * 100);

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
    <div 
      className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar: Timer & Navigation */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-xl">
            <Clock className="w-6 h-6 text-blue-600" />
            <span>{formatTime(sessionDuration)}</span>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors ${
              isPaused ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
            title={isPaused ? 'Retomar' : 'Pausar'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          {isPaused && (
            <span className="text-sm font-medium text-yellow-600">PAUSADO</span>
          )}
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
                Cancel
            </button>
            <button 
                onClick={() => onEndSession(evaluations)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center"
            >
                <Save className="w-4 h-4 mr-2" />
                Finish Session
            </button>
        </div>
      </div>

      {/* Player Context Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
         <button 
            onClick={() => setCurrentPlayerIndex(prev => Math.max(0, prev - 1))}
            disabled={currentPlayerIndex === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
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
            <h2 className="mt-2 text-lg font-bold text-gray-900">{currentPlayer.name}</h2>
            {currentPlayer.position && (
              <p className="text-sm text-gray-500">{currentPlayer.position}</p>
            )}
         </div>

         <button 
            onClick={() => setCurrentPlayerIndex(prev => Math.min(players.length - 1, prev + 1))}
            disabled={currentPlayerIndex === players.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
         >
            <ChevronRight className="w-8 h-8 text-gray-700" />
         </button>
      </div>

      {/* Progress Indicator */}
      <div className="w-full bg-gray-200 h-1.5">
        <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Scoring Area - Optimized for max 3 valences */}
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        <div className={`grid gap-6 ${activeValences.length === 1 ? 'grid-cols-1' : activeValences.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} max-w-6xl mx-auto`}>
            {activeValences.map((valence) => (
                <div key={valence.id} className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg text-gray-900">{valence.name}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            valence.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                            valence.category === 'Physical' ? 'bg-red-100 text-red-800' :
                            valence.category === 'Tactical' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {valence.category}
                        </span>
                    </div>
                    
                    {/* Score Buttons - Larger for faster tapping */}
                    <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map((score) => {
                            const isSelected = currentEvaluation.scores[valence.id] === score;
                            return (
                                <button
                                    key={score}
                                    onClick={() => handleScore(valence.id, score)}
                                    className={`
                                        h-16 rounded-xl font-bold text-2xl transition-all duration-150 transform
                                        ${isSelected 
                                            ? 'bg-blue-600 text-white shadow-xl scale-110 ring-4 ring-blue-300' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 hover:scale-105 active:scale-95'
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
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Observações do Atleta</h3>
            </div>
            <textarea
              value={playerNotes[currentPlayer.id] || ''}
              onChange={(e) => setPlayerNotes({...playerNotes, [currentPlayer.id]: e.target.value})}
              placeholder="Adicione observações específicas sobre este atleta..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Quick Action Hint */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-semibold">Tip:</span> Use ← → arrow keys to navigate between players quickly
          </p>
          <div className="mt-2 flex justify-center items-center space-x-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">← Prev</span>
            <span className="px-2 py-1 bg-gray-100 rounded">→ Next</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Mobile Helper (Optional for visual balance) */}
      <div className="md:hidden text-center p-2 text-xs text-gray-400 bg-gray-50">
        Swipe or tap arrows to change player
      </div>
    </div>
  );
};

export default ActiveSession;