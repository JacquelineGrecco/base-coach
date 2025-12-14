import React, { useState, useEffect } from 'react';
import { Users, Activity, Calendar, ArrowRight, AlertCircle, Plus, Folder, Clock, Target } from 'lucide-react';
import { teamService } from '../services/teamService';
import { sessionService, Session } from '../services/sessionService';
import { supabase } from '../lib/supabase';
import { VALENCES } from '../constants';

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

const Dashboard: React.FC<DashboardProps> = ({ onStartSession, onNavigateToTeams, onNavigateToReports }) => {
  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionEvaluations, setSessionEvaluations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId);
      loadSessions(selectedTeamId);
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
      
      // Show only the 5 most recent sessions
      setSessions((sessionsData || []).slice(0, 5));
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum time encontrado</h3>
          <p className="text-slate-600 mb-6">
            Crie seu primeiro time na seção "Times" para começar a treinar.
          </p>
          <button
            onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Criar Primeiro Time
          </button>
        </div>
      </div>
    );
  }

  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard do Treinador</h1>
                <p className="text-slate-500 mt-1">Bem-vindo! Pronto para a sessão de hoje?</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
                    className="px-4 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all flex items-center font-semibold"
                    title="Gerenciar times, categorias e atletas"
                >
                    <Folder className="w-5 h-5 mr-2" />
                    Gerenciar Times
                </button>
                <button 
                    onClick={onStartSession}
                    disabled={players.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={players.length === 0 ? 'Adicione atletas ao time primeiro' : 'Iniciar nova sessão'}
                >
                    Iniciar Nova Sessão
                    <ArrowRight className="w-5 h-5 ml-2" />
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Atletas Ativos</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{players.length}</div>
                <div className="text-sm text-slate-500 mt-1">{activeTeam.name}</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Categorias</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{activeTeam.category_count || 0}</div>
                <div className="text-sm text-slate-500 mt-1">Times divididos</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Modalidade</span>
                </div>
                <div className="text-xl font-bold text-slate-900 capitalize">{activeTeam.sport}</div>
                <div className="text-sm text-slate-500 mt-1">Esporte principal</div>
            </div>
        </div>

        {/* Recent Activity / Team List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Elenco Ativo - {activeTeam.name}</h3>
            </div>
            
            {players.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium mb-2">Nenhum atleta ativo neste time.</p>
                <p className="text-sm text-slate-500 mb-4">
                  Adicione atletas para começar a avaliar e treinar.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Atletas
                  </button>
                  <button
                    onClick={onNavigateToTeams || (() => window.location.hash = '#teams')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Criar Categorias
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                          <tr>
                              <th className="px-6 py-3 font-medium">#</th>
                              <th className="px-6 py-3 font-medium">Atleta</th>
                              <th className="px-6 py-3 font-medium">Posição</th>
                              <th className="px-6 py-3 font-medium">Nascimento</th>
                              <th className="px-6 py-3 font-medium text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {players.map(player => (
                              <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-slate-600 font-semibold">
                                      {player.jersey_number || '-'}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                              <span className="text-blue-700 font-semibold text-sm">
                                                  {player.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                              </span>
                                          </div>
                                          <span className="font-medium text-slate-900">{player.name}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600 text-sm">{player.position || '-'}</td>
                                  <td className="px-6 py-4 text-slate-600 text-sm">
                                      {player.birth_date ? new Date(player.birth_date).toLocaleDateString('pt-BR') : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Disponível
                                      </span>
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
                <p className="text-slate-600">Nenhuma sessão registrada ainda.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Inicie sua primeira sessão de avaliação.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">
                              {new Date(session.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {session.category_name && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {session.category_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.evaluation_count || 0} avaliações
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              {session.selected_valences.length} critérios
                            </span>
                            {session.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {session.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewSessionDetails(session)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                          Ver detalhes
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                    if (onNavigateToReports && sessionEvaluations.length > 0) {
                      // Pass the first evaluated player's ID
                      const firstEvaluation = sessionEvaluations[0];
                      const playerId = firstEvaluation?.players?.id;
                      onNavigateToReports(selectedSession.team_id, playerId);
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
