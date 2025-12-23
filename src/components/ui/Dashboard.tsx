'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, Calendar, ArrowRight, AlertCircle, Plus, Folder, Clock, Target, UserCheck, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from './Button';
import { LoadingSpinnerFullPage } from './LoadingSpinner';
import { EmptyState, EmptyStateCompact } from './EmptyState';
import { teamService } from '@/features/roster/services/teamService';
import { sessionService, Session } from '@/features/match/services/sessionService';
import { supabase } from '@/lib/supabase';
import { VALENCES } from '@/lib/constants';

interface DashboardProps {
  onStartSession: () => void;
  onNavigateToTeams?: () => void;
  onNavigateToReports?: (teamId?: string, playerId?: string) => void;
}

interface DbPlayer {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
  birth_date?: string;
  is_active: boolean;
}

interface DbTeam {
  id: string;
  name: string;
  sport: string;
  player_count?: number;
  category_count?: number;
}

type SessionWithAttendance = Session & {
  attendance?: {
    total: number;
    present: number;
    absent: number;
  };
  team_name?: string;
  category_name?: string | null;
};

const Dashboard: React.FC<DashboardProps> = ({ onStartSession, onNavigateToTeams, onNavigateToReports }) => {
  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionWithAttendance[]>([]);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithAttendance | null>(null);
  const [sessionEvaluations, setSessionEvaluations] = useState<any[]>([]);
  const [pendingEvaluationsCount, setPendingEvaluationsCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId);
      loadSessions(selectedTeamId);
    }
  }, [selectedTeamId]);

  // Load pending evaluations when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadPendingEvaluations();
    }
  }, [selectedTeamId]);

  async function loadDashboardData() {
    setLoading(true);
    setError('');

    const { teams: teamsData, error: teamsError } = await teamService.getTeams();

    if (teamsError) {
      setError('Erro ao carregar times: ' + teamsError.message);
      setLoading(false);
      return;
    }

    setTeams(teamsData || []);
    
    // Auto-select first team
    if (teamsData && teamsData.length > 0) {
      setSelectedTeamId(teamsData[0].id);
    }
    
    setLoading(false);
  }

  async function loadPlayers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true, nullsFirst: false })
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error loading players:', error);
      setError('Erro ao carregar atletas');
    }
  }

  async function loadSessions(teamId: string) {
    try {
      const { sessions: sessionsData, error } = await sessionService.getSessions(teamId);
      
      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }
      
      // Load attendance data for each session
      const sessionsWithAttendance = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: attendanceData } = await supabase
            .from('session_attendance')
            .select('id, is_present')
            .eq('session_id', session.id);
          
          const totalPlayers = attendanceData?.length || 0;
          const presentCount = attendanceData?.filter((a: any) => a.is_present).length || 0;
          
          return {
            ...session,
            attendance: {
              total: totalPlayers,
              present: presentCount,
              absent: totalPlayers - presentCount,
            }
          };
        })
      );
      
      // Show only the 5 most recent sessions
      setSessions(sessionsWithAttendance.slice(0, 5));
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    }
  }

  async function handleViewSessionDetails(session: Session) {
    setSelectedSession(session);
    
    // Load evaluations for this session
    try {
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          players(id, name, jersey_number, position)
        `)
        .eq('session_id', session.id);

      if (error) throw error;
      setSessionEvaluations(evaluations || []);
    } catch (error: any) {
      console.error('Error loading session evaluations:', error);
      setError('Erro ao carregar avaliações da sessão');
    }
  }

  if (loading) {
    return <LoadingSpinnerFullPage size="lg" label="Carregando dashboard..." />;
  }

  if (teams.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={Users}
          title="Nenhum time encontrado"
          description="Crie seu primeiro time para começar a gerenciar seus atletas e realizar sessões de treino."
          action={{
            label: 'Criar Primeiro Time',
            onClick: onNavigateToTeams || (() => window.location.hash = '#teams'),
            variant: 'success',
          }}
        />
      </div>
    );
  }

  async function loadPendingEvaluations() {
    // TODO: Fix this query - need to join through sessions table to filter by team_id
    // For now, set to 0 to prevent 400 errors from invalid query syntax
    setPendingEvaluationsCount(0);
    
    // The original query had .is('score', null) which is invalid since score is NOT NULL
    // Future implementation should query for incomplete evaluations properly
  }

  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  // Calculate dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia, Treinador!';
    if (hour < 18) return 'Boa tarde, Treinador!';
    return 'Boa noite, Treinador!';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getGreeting()}</h1>
                <p className="text-slate-600 mt-1">
                  {sessions.length > 0 
                    ? `Você tem ${sessions.length} sessões recentes com ${activeTeam.name}.`
                    : 'Pronto para iniciar uma nova sessão de treino?'
                  }
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
                    className="flex items-center gap-2 px-5 py-3 h-12 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 active:scale-95 font-medium"
                    title="Gerenciar times, categorias e atletas"
                >
                    <Folder className="w-5 h-5" />
                    Gerenciar Times
                </button>
                <button
                    onClick={onStartSession}
                    disabled={players.length === 0}
                    className={`flex items-center gap-2 px-8 py-3 h-14 rounded-xl font-bold text-lg transition-all duration-200 active:scale-95 ${
                      players.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300'
                    }`}
                    title={players.length === 0 ? 'Adicione atletas ao time primeiro' : 'Iniciar nova sessão'}
                >
                    Iniciar Nova Sessão
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Team Selector */}
        {teams.length > 1 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecione o Time:
            </label>
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.player_count || 0} atletas)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Stats - Actionable Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Team Health */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <UserCheck className="w-7 h-7 text-emerald-600" />
                    </div>
                </div>
                <div className="text-5xl font-black text-slate-900 tabular-nums mb-2">{players.length}</div>
                <div className="text-sm font-medium text-slate-700 tracking-tight">Atletas Disponíveis</div>
                <div className="text-xs text-slate-500 mt-1">{activeTeam.name}</div>
            </div>

            {/* Card 2: Next Session or Recent Activity */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => {
                   if (sessions.length > 0) {
                     handleViewSessionDetails(sessions[0]);
                   }
                 }}>
                <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Clock className="w-7 h-7 text-blue-600" />
                    </div>
                </div>
                {sessions.length > 0 ? (
                  <>
                    <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                      {new Date(sessions[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-sm font-medium text-slate-700">Última Sessão</div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Ver detalhes
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">—</div>
                    <div className="text-sm font-medium text-slate-700">Nenhuma Sessão</div>
                    <div className="text-xs text-slate-500 mt-1">Inicie sua primeira sessão</div>
                  </>
                )}
            </div>

            {/* Card 3: Pending Evaluations */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigateToReports && onNavigateToReports(activeTeam.id)}>
                <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Target className="w-7 h-7 text-orange-600" />
                    </div>
                </div>
                <div className="text-5xl font-black text-slate-900 tabular-nums mb-2">
                  {sessions.reduce((acc, s) => acc + (s.evaluation_count || 0), 0)}
                </div>
                <div className="text-sm font-medium text-slate-700">Avaliações Feitas</div>
                <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Ver relatórios
                </div>
            </div>
        </div>

        {/* Recent Activity / Team List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Elenco Ativo - {activeTeam.name}</h3>
            </div>
            
            {players.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Nenhum atleta ativo</h4>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Adicione atletas ao seu time para começar a avaliar e treinar.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
                    className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 active:scale-95 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Atletas
                  </button>
                </div>
              </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <tr>
                              <th className="px-6 py-4 font-semibold">#</th>
                              <th className="px-6 py-4 font-semibold">Atleta</th>
                              <th className="px-6 py-4 font-semibold">Posição</th>
                              <th className="px-6 py-4 font-semibold">Nascimento</th>
                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                          {players.map(player => (
                            <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 text-slate-700 font-bold tabular-nums">
                                      {player.jersey_number || '—'}
                                  </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                              <span className="text-white font-bold text-sm">
                                                  {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                              </span>
                                          </div>
                                        <span className="font-semibold text-slate-900">{player.name}</span>
                                    </div>
                                </td>
                                  <td className="px-6 py-4 text-slate-700 text-sm font-medium">{player.position || '—'}</td>
                                  <td className="px-6 py-4 text-slate-600 text-sm">
                                      {player.birth_date ? new Date(player.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                  </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                          Disponível
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => onNavigateToReports && onNavigateToReports(activeTeam.id, player.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg"
                                    title="Ações rápidas"
                                  >
                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sessões Recentes</h3>
                  <p className="text-sm text-slate-500 mt-1">Últimas 5 sessões de treino</p>
                </div>
                <Clock className="w-6 h-6 text-slate-400" />
            </div>
            
            {sessions.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Nenhuma sessão registrada ainda.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Inicie sua primeira sessão de avaliação.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                  {sessions.map((session) => {
                    const sessionDate = new Date(session.date);
                    const avgScore = session.evaluation_count && session.evaluation_count > 0 
                      ? ((session as any).avg_score || 0) 
                      : 0;
                    const attendanceRate = session.attendance && session.attendance.total > 0
                      ? (session.attendance.present / session.attendance.total) * 100
                      : 0;
                    
                    return (
                    <div
                      key={session.id}
                      className="p-5 hover:bg-slate-50 transition-all cursor-pointer group"
                      onClick={() => handleViewSessionDetails(session)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Date & Time - Prominent Title */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-lg font-bold text-slate-900 tracking-tight">
                              {sessionDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-slate-500 font-medium tabular-nums">
                              {sessionDate.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {session.category_name && (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
                                {session.category_name}
                              </span>
                            )}
                            {/* Performance Indicator */}
                            {attendanceRate >= 80 && (
                              <div className="ml-auto flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                <TrendingUp className="w-4 h-4" />
                                Ótima presença
                              </div>
                            )}
                          </div>
                          
                          {/* Summary Stats - Clean Pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Attendance */}
                            {session.attendance && session.attendance.total > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-700 tabular-nums">
                                  {session.attendance.present}/{session.attendance.total}
                                </span>
                                <span className="text-xs text-emerald-600">presentes</span>
                              </div>
                            )}
                            
                            {/* Evaluations */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-bold text-blue-700 tabular-nums">
                                {session.evaluation_count || 0}
                              </span>
                              <span className="text-xs text-blue-600">avaliações</span>
                            </div>
                            
                            {/* Criteria */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                              <Activity className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-bold text-purple-700 tabular-nums">
                                {session.selected_valences.length}
                              </span>
                              <span className="text-xs text-purple-600">critérios</span>
                            </div>
                            
                            {/* Duration */}
                            {session.duration_minutes && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-bold text-amber-700 tabular-nums">
                                  {session.duration_minutes}
                                </span>
                                <span className="text-xs text-amber-600">min</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button 
                          className="flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-blue-200 group-hover:border-blue-200"
                        >
                          Ver detalhes
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )})}
              </div>
            )}
        </div>

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Detalhes da Sessão</h3>
                    <p className="text-blue-100">
                      {new Date(selectedSession.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      setSessionEvaluations([]);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Session Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-600 mb-1">Time</div>
                    <div className="font-semibold text-slate-900">{selectedSession.team_name}</div>
                  </div>
                  {selectedSession.category_name && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-600 mb-1">Categoria</div>
                      <div className="font-semibold text-purple-900">{selectedSession.category_name}</div>
                    </div>
                  )}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Avaliações</div>
                    <div className="font-semibold text-blue-900">{sessionEvaluations.length}</div>
                  </div>
                  {selectedSession.attendance && selectedSession.attendance.total > 0 && (
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="text-sm text-emerald-600 mb-1 flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Presença
                      </div>
                      <div className="font-semibold text-emerald-900">
                        {selectedSession.attendance.present}/{selectedSession.attendance.total}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">
                        {((selectedSession.attendance.present / selectedSession.attendance.total) * 100).toFixed(0)}% presentes
                      </div>
                    </div>
                  )}
                  {selectedSession.duration_minutes && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Duração</div>
                      <div className="font-semibold text-green-900">{selectedSession.duration_minutes} min</div>
                    </div>
                  )}
                </div>

                {/* Criteria/Valences Used */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Critérios Avaliados
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.selected_valences.map((valenceId) => {
                      const valence = VALENCES.find(v => v.id === valenceId);
                      if (!valence) return null;
                      
                      const categoryColors = {
                        'Technical': 'bg-blue-100 text-blue-700 border-blue-200',
                        'Physical': 'bg-red-100 text-red-700 border-red-200',
                        'Tactical': 'bg-purple-100 text-purple-700 border-purple-200',
                        'Psychological': 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      };
                      
                      return (
                        <div
                          key={valenceId}
                          className={`px-3 py-2 rounded-lg border font-medium text-sm ${
                            categoryColors[valence.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {valence.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Evaluations List */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Avaliações dos Atletas</h4>
                  {sessionEvaluations.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhuma avaliação encontrada</p>
                  ) : (
                    <div className="space-y-3">
                      {sessionEvaluations.map((evaluation: any) => (
                        <div key={evaluation.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-semibold text-emerald-700">
                                {evaluation.players?.jersey_number || '?'}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{evaluation.players?.name || 'Atleta'}</div>
                                <div className="text-sm text-slate-500">{evaluation.players?.position || '—'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{evaluation.score}</div>
                                <div className="text-xs text-slate-500">Pontuação</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setSessionEvaluations([]);
                  }}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToReports) {
                      if (sessionEvaluations.length > 0) {
                        // Pass the first evaluated player's ID
                        const firstEvaluation = sessionEvaluations[0];
                        const playerId = firstEvaluation?.players?.id;
                        console.log('Navigating to Reports:', {
                          teamId: selectedSession.team_id,
                          playerId,
                          playerName: firstEvaluation?.players?.name
                        });
                        onNavigateToReports(selectedSession.team_id, playerId);
                      } else {
                        // No evaluations, just go to team view
                        onNavigateToReports(selectedSession.team_id);
                      }
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Ver Relatório Completo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Dashboard;
