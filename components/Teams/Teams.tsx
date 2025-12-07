import React, { useState, useEffect } from 'react';
import { Plus, Users, Folder, Archive, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { teamService, Team } from '../../services/teamService';
import { useAuth } from '../../contexts/AuthContext';

interface TeamsProps {
  onViewTeamDetail: (teamId: string) => void;
}

const Teams: React.FC<TeamsProps> = ({ onViewTeamDetail }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sport: 'futsal',
    season: new Date().getFullYear().toString(),
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [showArchived]);

  async function loadTeams() {
    setLoading(true);
    const { teams: data, error } = await teamService.getTeams(showArchived);
    
    if (error) {
      setError('Erro ao carregar times: ' + error.message);
    } else {
      setTeams(data || []);
    }
    
    setLoading(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Por favor, preencha o nome do time');
      return;
    }

    setError('');
    setCreating(true);

    const { team, error } = await teamService.createTeam(formData);

    if (error) {
      setError('Erro ao criar time: ' + error.message);
    } else {
      setSuccess('Time criado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        sport: 'futsal',
        season: new Date().getFullYear().toString(),
        notes: '',
      });
      loadTeams();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }

    setCreating(false);
  }

  async function handleArchiveTeam(teamId: string) {
    if (!confirm('Tem certeza que deseja arquivar este time?')) return;

    const { error } = await teamService.archiveTeam(teamId);

    if (error) {
      setError('Erro ao arquivar time: ' + error.message);
    } else {
      setSuccess('Time arquivado com sucesso!');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function handleUnarchiveTeam(teamId: string) {
    const { error } = await teamService.unarchiveTeam(teamId);

    if (error) {
      setError('Erro ao desarquivar time: ' + error.message);
    } else {
      setSuccess('Time desarquivado com sucesso!');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const activeTeams = teams.filter(t => !t.is_archived);
  const archivedTeams = teams.filter(t => t.is_archived);
  const displayTeams = showArchived ? archivedTeams : activeTeams;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Times</h1>
        <p className="text-gray-600">Gerencie seus times e categorias</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar Novo Time
        </button>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Archive className="w-5 h-5" />
          {showArchived ? 'Ver Times Ativos' : 'Ver Arquivados'}
          {archivedTeams.length > 0 && (
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {archivedTeams.length}
            </span>
          )}
        </button>
      </div>

      {/* Teams Grid */}
      {displayTeams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showArchived ? 'Nenhum time arquivado' : 'Nenhum time criado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {showArchived 
              ? 'Você não tem times arquivados no momento.'
              : 'Comece criando seu primeiro time!'}
          </p>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Time
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {team.sport} • {team.season}
                  </p>
                </div>
                {team.is_archived && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                    Arquivado
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Folder className="w-4 h-4" />
                  <span>{team.category_count || 0} categorias</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{team.player_count || 0} atletas</span>
                </div>
              </div>

              {/* Notes */}
              {team.notes && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {team.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onViewTeamDetail(team.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  Ver Detalhes
                </button>
                
                {team.is_archived ? (
                  <button
                    onClick={() => handleUnarchiveTeam(team.id)}
                    className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    title="Desarquivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveTeam(team.id)}
                    className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    title="Arquivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Criar Novo Time
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Time *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Futsal Feminino Vila Nova"
                  required
                />
              </div>

              {/* Sport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Esporte *
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="futsal">Futsal</option>
                  <option value="futebol">Futebol</option>
                  <option value="volei">Vôlei</option>
                  <option value="basquete">Basquete</option>
                  <option value="handebol">Handebol</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporada
                </label>
                <input
                  type="text"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: 2025"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Informações adicionais sobre o time..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;

