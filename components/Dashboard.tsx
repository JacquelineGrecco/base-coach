import React, { useState, useEffect } from 'react';
import { Users, Activity, Calendar, ArrowRight, AlertCircle, Plus, Folder } from 'lucide-react';
import { teamService } from '../services/teamService';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onStartSession: () => void;
  onNavigateToTeams?: () => void;
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

const Dashboard: React.FC<DashboardProps> = ({ onStartSession, onNavigateToTeams }) => {
  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId);
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
    </div>
  );
};

export default Dashboard;
