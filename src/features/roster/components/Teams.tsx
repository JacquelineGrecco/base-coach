'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, Folder, Archive, Edit2, Trash2, AlertCircle, CheckCircle, Lock, Crown } from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { subscriptionService, SubscriptionInfo } from '@/features/auth/services/subscriptionService';
import { UpgradeLimitModal } from '@/components/ui/UpgradeLimitModal';
import { EmptyStateCompact } from '@/components/ui/EmptyState';

interface TeamsProps {
  onViewTeamDetail: (teamId: string) => void;
  onUpgradeClick?: () => void;
}

const Teams: React.FC<TeamsProps> = ({ onViewTeamDetail, onUpgradeClick }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sport: 'futsal',
    season: new Date().getFullYear().toString(),
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTeams();
    loadSubscription();
  }, [showArchived]);

  async function loadSubscription() {
    const data = await subscriptionService.getUserSubscription();
    if (!data) {
      console.error('Error loading subscription');
    }
    setSubscription(data);
  }

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

  // Check if user can create more teams
  function canCreateTeam(): { allowed: boolean; reason?: string } {
    if (!subscription) return { allowed: true }; // Loading or not available
    
    const activeTeamsCount = teams.filter(t => !t.is_archived).length;
    const limits = subscriptionService.getTierLimits(subscription.tier);
    const maxTeams = limits.teams;
    
    if (maxTeams !== Infinity && activeTeamsCount >= maxTeams) {
      return { 
        allowed: false, 
        reason: `Você atingiu o limite de ${maxTeams} time${maxTeams > 1 ? 's' : ''} do plano ${subscription.tier}. Faça upgrade para criar mais times.`
      };
    }
    
    return { allowed: true };
  }

  function handleCreateButtonClick() {
    const canCreate = canCreateTeam();
    
    if (!canCreate.allowed) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setShowCreateModal(true);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Por favor, preencha o nome do time');
      return;
    }

    // Check if team name already exists
    const existingTeam = teams.find(
      t => t.name.toLowerCase() === formData.name.trim().toLowerCase() && !t.is_archived
    );
    
    if (existingTeam) {
      setError(`Já existe um time chamado "${formData.name}". Escolha outro nome.`);
      setCreating(false);
      return;
    }

    setError('');
    setCreating(true);

    const { team, error } = await teamService.createTeam(formData);

    if (error) {
      // Handle unique constraint error from database
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setError(`Já existe um time chamado "${formData.name}". Escolha outro nome.`);
      } else {
        setError('Erro ao criar time: ' + error.message);
      }
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
    if (!confirm('Tem certeza que deseja arquivar este time?\n\n⚠️ TODAS as categorias e atletas deste time também serão arquivados.\n\n⏰ Tudo será excluído permanentemente após 7 dias.')) return;

    const { error } = await teamService.archiveTeam(teamId);

    if (error) {
      setError('Erro ao arquivar time: ' + error.message);
    } else {
      setSuccess('Time, categorias e atletas arquivados! Excluídos em 7 dias.');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function handleUnarchiveTeam(teamId: string) {
    const { error } = await teamService.unarchiveTeam(teamId);

    if (error) {
      setError('Erro ao desarquivar time: ' + error.message);
    } else {
      setSuccess('Time, categorias e atletas restaurados!');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  function handleEditTeam(team: Team) {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      sport: team.sport,
      season: team.season || new Date().getFullYear().toString(),
      notes: team.notes || '',
    });
    setShowEditModal(true);
  }

  async function handleUpdateTeam(e: React.FormEvent) {
    e.preventDefault();
    
    if (!editingTeam || !formData.name.trim()) {
      setError('Por favor, preencha o nome do time');
      return;
    }

    setError('');
    setUpdating(true);

    const { error } = await teamService.updateTeam(editingTeam.id, formData);

    if (error) {
      setError('Erro ao atualizar time: ' + error.message);
    } else {
      setSuccess('Time atualizado com sucesso!');
      setShowEditModal(false);
      setEditingTeam(null);
      setFormData({
        name: '',
        sport: 'futsal',
        season: new Date().getFullYear().toString(),
        notes: '',
      });
      loadTeams();
      
      setTimeout(() => setSuccess(''), 3000);
    }

    setUpdating(false);
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

  // Get tier limits
  const tierLimits = subscription ? subscriptionService.getTierLimits(subscription.tier) : null;
  const teamLimit = tierLimits?.teams || 1;
  const isUnlimited = teamLimit === Infinity;
  const atTeamLimit = !isUnlimited && activeTeams.length >= teamLimit;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Limit Counter */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Times</h1>
          <p className="text-gray-600">Gerencie seus times e categorias</p>
        </div>
        {subscription && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${atTeamLimit ? 'text-red-600' : 'text-slate-900'}`}>
              {isUnlimited ? (
                <span className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Ilimitado
                </span>
              ) : (
                <span>{activeTeams.length}/{teamLimit}</span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1">
              {isUnlimited ? 'Times' : 'Times disponíveis'}
            </p>
          </div>
        )}
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
        <div>
          <button
            onClick={handleCreateButtonClick}
            disabled={atTeamLimit}
            className={`flex items-center gap-2 h-12 px-6 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
              atTeamLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {atTeamLimit ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            Criar Novo Time
          </button>
          {atTeamLimit && (
            <p className="text-xs text-red-600 mt-1">
              Limite atingido • <button onClick={() => onUpgradeClick && onUpgradeClick()} className="underline font-semibold">Fazer upgrade</button>
            </p>
          )}
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 h-12 px-3 text-slate-700 hover:text-slate-900 transition-all duration-200 active:scale-95"
        >
          <Archive className="w-5 h-5" />
          {showArchived ? 'Ver Times Ativos' : 'Ver Arquivados'}
          {archivedTeams.length > 0 && (
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {archivedTeams.length}
            </span>
          )}
        </button>
      </div>

      {/* Teams Grid */}
      {displayTeams.length === 0 ? (
        <EmptyStateCompact
          icon={Folder}
          title={showArchived ? 'Nenhum time arquivado' : 'Nenhum time criado'}
          description={showArchived 
            ? 'Você não tem times arquivados no momento.'
            : 'Comece criando seu primeiro time!'}
          action={!showArchived ? {
            label: 'Criar Primeiro Time',
            onClick: () => setShowCreateModal(true),
            icon: Plus,
            variant: 'success',
          } : undefined}
        />
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
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTeam(team);
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                {team.is_archived ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchiveTeam(team.id);
                    }}
                    className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    title="Desarquivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveTeam(team.id);
                    }}
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
                  type="number"
                  min="2020"
                  max="2099"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="2025"
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

      {/* Edit Team Modal */}
      {showEditModal && editingTeam && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Time
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateTeam} className="p-6 space-y-4">
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
                  type="number"
                  min="2020"
                  max="2099"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="2025"
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
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Limit Modal */}
      <UpgradeLimitModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        limitType="teams"
        currentTier={subscription?.subscription_tier || 'free'}
        currentCount={activeTeams.length}
        limit={teamLimit}
        onUpgrade={() => onUpgradeClick && onUpgradeClick()}
      />
    </div>
  );
};

export default Teams;

