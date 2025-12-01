import React, { useState, useMemo } from 'react';
import { Team, Player, Evaluation } from '../types';
import { VALENCES } from '../constants';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Clock } from 'lucide-react';

interface ActiveSessionProps {
  team: Team;
  selectedValenceIds: string[];
  onEndSession: (evaluations: Evaluation[]) => void;
  onCancel: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ team, selectedValenceIds, onEndSession, onCancel }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Filter valences to show only selected ones
  const activeValences = VALENCES.filter(v => selectedValenceIds.includes(v.id));
  
  // Swipe detection constants
  const minSwipeDistance = 50;
  
  // Timer simulation
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for faster workflow
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentPlayerIndex < team.players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentPlayerIndex > 0) {
        setCurrentPlayerIndex(prev => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPlayerIndex, team.players.length]);

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
    
    if (isLeftSwipe && currentPlayerIndex < team.players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else if (isRightSwipe && currentPlayerIndex > 0) {
      setCurrentPlayerIndex(prev => prev - 1);
    }
  };

  const currentPlayer = team.players[currentPlayerIndex];

  // Get existing evaluation for current player or create blank
  const currentEvaluation = useMemo(() => {
    return evaluations.find(e => e.playerId === currentPlayer.id) || {
      playerId: currentPlayer.id,
      sessionId: 'temp-session',
      scores: {},
      timestamp: Date.now()
    };
  }, [evaluations, currentPlayer.id]);

  const handleScore = (valenceId: string, score: number) => {
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

  const progress = Math.round(((currentPlayerIndex + 1) / team.players.length) * 100);

  return (
    <div 
      className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar: Timer & Navigation */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-blue-900 font-bold text-xl">
          <Clock className="w-6 h-6 text-blue-600" />
          <span>{formatTime(sessionDuration)}</span>
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
                <img 
                    src={currentPlayer.photoUrl} 
                    alt={currentPlayer.name} 
                    className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover shadow-sm"
                />
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    #{currentPlayer.number}
                </div>
            </div>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{currentPlayer.name}</h2>
            <p className="text-sm text-gray-500">{currentPlayer.position} | {currentPlayer.dominantLeg}</p>
         </div>

         <button 
            onClick={() => setCurrentPlayerIndex(prev => Math.min(team.players.length - 1, prev + 1))}
            disabled={currentPlayerIndex === team.players.length - 1}
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