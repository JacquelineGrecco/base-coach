'use client';

import React, { useState } from 'react';
import { Clock, Users, Trophy, ArrowLeftRight, FileText, Sparkles, Save, Home, Loader2, Target } from 'lucide-react';
import { usePostMatchReport, PostMatchSessionData } from '../hooks/usePostMatchReport';
import { Substitution } from '../hooks/useSubstitutions';
import { SessionNote } from './SidelineActions';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Evaluation } from '@/types';
import { VALENCES } from '@/lib/constants';

interface SessionSummaryProps {
  duration: number;
  teamScore: number;
  opponentScore: number;
  substitutions: Substitution[];
  notes: SessionNote[];
  playerStatuses: Map<string, { playerName: string; minutesPlayed: number }>;
  isMatch: boolean;
  evaluations: Evaluation[];
  players: Array<{ id: string; name: string; position?: string; jersey_number?: number }>;
  valences: typeof VALENCES;
  onSaveAndExit: (aiReport?: string) => void;
  onGoToDashboard: () => void;
}

/**
 * Post-match summary screen with key stats and AI report generation
 * Displayed after ending a live session
 */
export function SessionSummary({
  duration,
  teamScore,
  opponentScore,
  substitutions,
  notes,
  playerStatuses,
  isMatch,
  evaluations,
  players,
  valences,
  onSaveAndExit,
  onGoToDashboard,
}: SessionSummaryProps) {
  const { report, isGenerating, error, generateReport } = usePostMatchReport();
  const [hasGenerated, setHasGenerated] = useState(false);

  // Calculate stats
  const formattedDuration = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  
  const playerArray = Array.from(playerStatuses.values());
  const mostActivePlayer = playerArray.reduce((max, player) => 
    player.minutesPlayed > max.minutesPlayed ? player : max
  , { playerName: 'N/A', minutesPlayed: 0 });
  
  const avgMinutes = playerArray.length > 0
    ? Math.round(playerArray.reduce((sum, p) => sum + p.minutesPlayed, 0) / playerArray.length)
    : 0;

  // Training-specific stats
  const evaluatedPlayersCount = evaluations.filter(e => Object.keys(e.scores).length > 0).length;
  const totalEvaluations = evaluations.reduce((sum, e) => sum + Object.keys(e.scores).length, 0);
  const valencesEvaluated = valences.length;

  // Prepare data for AI report
  const handleGenerateReport = async () => {
    const playerMinutes: Record<string, { total: number; stints: number[] }> = {};
    
    playerStatuses.forEach((player) => {
      playerMinutes[player.playerName] = {
        total: player.minutesPlayed,
        stints: [player.minutesPlayed], // Simplified - in real app, track each stint
      };
    });

    const sessionData: PostMatchSessionData = {
      duration,
      teamScore,
      opponentScore,
      substitutions: substitutions.map(sub => ({
        playerOutName: sub.playerOutName,
        playerInName: sub.playerInName,
        matchMinute: sub.matchMinute,
      })),
      notes: notes.map(note => ({
        type: note.type,
        playerName: note.playerName,
        content: note.content,
        matchMinute: note.matchMinute,
      })),
      playerMinutes,
    };

    await generateReport(sessionData);
    setHasGenerated(true);
  };

  const handleSaveWithReport = () => {
    onSaveAndExit(report || undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Sessão Finalizada!</h1>
          <p className="text-blue-100">
            {isMatch 
              ? 'Veja o resumo e gere um relatório detalhado com IA'
              : 'Resumo do treino - Veja as avaliações e gere um relatório com IA'
            }
          </p>
        </div>

        {/* Training Session Summary */}
        {!isMatch && (
          <>
            {/* Duration and Evaluation Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <span className="text-slate-600 font-medium">Duração</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 tabular-nums">{formattedDuration}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                  <span className="text-slate-600 font-medium">Atletas Avaliados</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 tabular-nums">{evaluatedPlayersCount}</p>
                <p className="text-sm text-slate-500 mt-1">de {players.length} presentes</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  <span className="text-slate-600 font-medium">Valências</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 tabular-nums">{valencesEvaluated}</p>
                <p className="text-sm text-slate-500 mt-1">{totalEvaluations} avaliações</p>
              </Card>
            </div>

            {/* Valences Evaluated */}
            {valences.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Valências Avaliadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {valences.map((valence) => {
                    const valenceEvaluations = evaluations.filter(e => 
                      Object.keys(e.scores).includes(valence.id)
                    ).length;
                    return (
                      <div
                        key={valence.id}
                        className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2"
                      >
                        <span className="font-semibold text-slate-900">{valence.name}</span>
                        <span className="text-sm text-slate-500">({valenceEvaluations})</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Match Session Summary */}
        {isMatch && (
          <>
            {/* Score and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <span className="text-slate-600 font-medium">Duração</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 tabular-nums">{formattedDuration}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="text-slate-600 font-medium">Placar Final</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 tabular-nums">
                  {teamScore} × {opponentScore}
                </p>
              </Card>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-600 font-medium">Substituições</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{substitutions.length}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-600 font-medium">Jogador Destaque</span>
                </div>
                <p className="text-lg font-bold text-slate-900 truncate">{mostActivePlayer.playerName}</p>
                <p className="text-sm text-slate-500 tabular-nums">{mostActivePlayer.minutesPlayed}min jogados</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-slate-600 font-medium">Média de Minutos</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{avgMinutes}min</p>
              </Card>
            </div>
          </>
        )}

        {/* Substitution Timeline - Only for matches */}
        {isMatch && substitutions.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              Linha do Tempo de Substituições
            </h3>
            <div className="space-y-3">
              {substitutions.map((sub, index) => (
                <div key={sub.id} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 font-mono tabular-nums w-12">
                    {Math.floor(sub.matchMinute / 60)}min
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-lg p-3">
                    <span className="text-red-600 font-medium">{sub.playerOutName}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="text-green-600 font-medium">{sub.playerInName}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Session Notes */}
        {notes.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Notas da Sessão ({notes.length})
            </h3>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3 text-sm">
                  <span className="text-slate-500 font-mono tabular-nums w-12 flex-shrink-0">
                    {Math.floor(note.matchMinute / 60)}min
                  </span>
                  <div className="flex-1">
                    {note.type === 'player' && note.playerName && (
                      <span className="text-blue-600 font-medium">{note.playerName}: </span>
                    )}
                    <span className="text-slate-700">{note.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Report Section */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Relatório com Inteligência Artificial
          </h3>

          {!hasGenerated && !isGenerating && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-6">
                {isMatch 
                  ? 'Gere um relatório detalhado com análise tática, gestão de atletas e recomendações para a próxima sessão.'
                  : 'Gere um relatório detalhado do treino com análise das avaliações, pontos fortes e áreas de melhoria para cada atleta.'
                }
              </p>
              <button
                onClick={handleGenerateReport}
                className="
                  h-14 px-8
                  bg-gradient-to-r from-blue-600 to-purple-600
                  hover:from-blue-700 hover:to-purple-700
                  text-white font-bold text-lg
                  rounded-xl
                  transition-all duration-200
                  active:scale-95
                  shadow-lg hover:shadow-xl
                  flex items-center gap-3 mx-auto
                "
              >
                <Sparkles className="w-5 h-5" />
                Gerar Relatório com IA
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-700 font-medium">Analisando sessão...</p>
              <p className="text-sm text-slate-500 mt-2">Isso pode levar alguns segundos</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={handleGenerateReport}
                className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm underline"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {report && (
            <div className="prose prose-slate max-w-none">
              <div className="bg-slate-50 rounded-xl p-6 whitespace-pre-wrap text-sm">
                {report}
              </div>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleSaveWithReport}
            className="
              h-14
              bg-blue-600 hover:bg-blue-700
              text-white font-bold
              rounded-xl
              transition-all duration-200
              active:scale-95
              flex items-center justify-center gap-2
              col-span-1 sm:col-span-2
            "
          >
            <Save className="w-5 h-5" />
            {report ? 'Salvar com Relatório' : 'Salvar e Ver Depois'}
          </button>

          <button
            onClick={onGoToDashboard}
            className="
              h-14
              bg-slate-100 hover:bg-slate-200
              text-slate-700 font-medium
              rounded-xl
              transition-all duration-200
              active:scale-95
              flex items-center justify-center gap-2
            "
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}


