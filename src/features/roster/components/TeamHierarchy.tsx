'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Users, 
  Folder, 
  Edit2, 
  Archive, 
  User,
  AlertCircle, 
  CheckCircle,
  Lock,
  Crown,
  MoreVertical,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';
import { categoryService, Category } from '@/features/roster/services/categoryService';
import { supabase } from '@/lib/supabase';
import { subscriptionService, SubscriptionInfo } from '@/features/auth/services/subscriptionService';
import { UpgradeLimitModal } from '@/components/ui/UpgradeLimitModal';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
  position?: string;
  birth_date?: string;
}

interface CategoryWithPlayers extends Category {
  players: Player[];
  isExpanded: boolean;
}

interface TeamWithCategories extends Team {
  categories: CategoryWithPlayers[];
  uncategorizedPlayers: Player[];
  isExpanded: boolean;
}

interface TeamHierarchyProps {
  onViewTeamDetail: (teamId: string) => void;
  onViewPlayers: (teamId: string, categoryId: string | null, categoryName: string) => void;
  onUpgradeClick?: () => void;
}

const TeamHierarchy: React.FC<TeamHierarchyProps> = ({ 
  onViewTeamDetail, 
  onViewPlayers,
  onUpgradeClick 
}) => {
  const [teams, setTeams] = useState<TeamWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showQuickAddPlayer, setShowQuickAddPlayer] = useState<{ teamId: string; categoryId: string | null } | null>(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Form state for team creation
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    sport: 'futsal',
    season: new Date().getFullYear().toString(),
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      // Load subscription
      const subData = await subscriptionService.getUserSubscription();
      setSubscription(subData);

      // Load teams
      const { teams: teamsData, error: teamsError } = await teamService.getTeams(false);
      if (teamsError) throw teamsError;

      // Load categories and players for each team
      const teamsWithData: TeamWithCategories[] = await Promise.all(
        (teamsData || []).map(async (team) => {
          // Load categories
          const { categories: categoriesData } = await categoryService.getCategoriesByTeam(team.id);
          
          // Load players for each category
          const categoriesWithPlayers: CategoryWithPlayers[] = await Promise.all(
            (categoriesData || []).map(async (category) => {
              const { data: players } = await supabase
                .from('players')
                .select('id, name, jersey_number, position, birth_date')
                .eq('category_id', category.id)
                .eq('is_active', true)
                .order('jersey_number', { ascending: true, nullsFirst: false })
                .order('name')
                .limit(10);

              return {
                ...category,
                players: players || [],
                isExpanded: false,
              };
            })
          );

          // Load uncategorized players
          const { data: uncategorizedPlayers } = await supabase
            .from('players')
            .select('id, name, jersey_number, position, birth_date')
            .eq('team_id', team.id)
            .is('category_id', null)
            .eq('is_active', true)
            .order('jersey_number', { ascending: true, nullsFirst: false })
            .order('name')
            .limit(10);

          return {
            ...team,
            categories: categoriesWithPlayers,
            uncategorizedPlayers: uncategorizedPlayers || [],
            isExpanded: true, // Start expanded
          };
        })
      );

      setTeams(teamsWithData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados: ' + err.message);
    }

    setLoading(false);
  }

  function toggleTeam(teamId: string) {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, isExpanded: !team.isExpanded } : team
    ));
  }

  function toggleCategory(teamId: string, categoryId: string) {
    setTeams(teams.map(team => {
      if (team.id !== teamId) return team;
      return {
        ...team,
        categories: team.categories.map(cat =>
          cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
        ),
      };
    }));
  }

  async function handleQuickAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!showQuickAddPlayer || !quickAddName.trim()) return;

    setQuickAddLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('players')
        .insert({
          team_id: showQuickAddPlayer.teamId,
          category_id: showQuickAddPlayer.categoryId,
          name: quickAddName.trim(),
        } as any);

      if (error) throw error;

      setSuccess('Atleta adicionado!');
      setQuickAddName('');
      setShowQuickAddPlayer(null);
      loadData(); // Reload to show new player

      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError('Erro ao adicionar atleta: ' + err.message);
    }

    setQuickAddLoading(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamFormData.name.trim()) {
      setError('Por favor, preencha o nome do time');
      return;
    }

    setCreating(true);
    setError('');

    const { team, error } = await teamService.createTeam(teamFormData);

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setError(`Já existe um time chamado "${teamFormData.name}".`);
      } else {
        setError('Erro ao criar time: ' + error.message);
      }
    } else {
      setSuccess('Time criado com sucesso!');
      setShowCreateTeamModal(false);
      setTeamFormData({
        name: '',
        sport: 'futsal',
        season: new Date().getFullYear().toString(),
        notes: '',
      });
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    }

    setCreating(false);
  }

  function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Get tier limits
  const tierLimits = subscription ? subscriptionService.getTierLimits(subscription.tier) : null;
  const teamLimit = tierLimits?.teams || 1;
  const isUnlimited = teamLimit === Infinity;
  const activeTeamsCount = teams.length;
  const atTeamLimit = !isUnlimited && activeTeamsCount >= teamLimit;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Meus Times</h1>
          <p className="text-slate-600 text-sm md:text-base">Gerencie times, categorias e atletas</p>
        </div>
        
        <div className="flex items-center gap-3">
          {subscription && !isUnlimited && (
            <div className="text-right hidden md:block">
              <div className={`text-lg font-bold ${atTeamLimit ? 'text-red-600' : 'text-slate-900'}`}>
                {activeTeamsCount}/{teamLimit}
              </div>
              <p className="text-xs text-slate-500">Times</p>
            </div>
          )}
          
          <button
            onClick={() => atTeamLimit ? setShowUpgradePrompt(true) : setShowCreateTeamModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${
              atTeamLimit
                ? 'bg-slate-200 text-slate-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
            }`}
          >
            {atTeamLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Novo Time</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {teams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum time criado</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Comece criando seu primeiro time para organizar categorias e atletas.
          </p>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Time
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div 
              key={team.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Team Header */}
              <div 
                className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleTeam(team.id)}
              >
                <div className="flex items-center gap-3">
                  <button className="p-1 -ml-1">
                    {team.isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900">{team.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="capitalize">{team.sport}</span>
                      <span>•</span>
                      <span>{team.category_count || 0} categorias</span>
                      <span>•</span>
                      <span>{team.player_count || 0} atletas</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTeamDetail(team.id);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Gerenciar time"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {team.isExpanded && (
                <div className="border-t border-slate-100">
                  {/* Uncategorized Players */}
                  {(team.uncategorizedPlayers.length > 0 || team.categories.length === 0) && (
                    <div className="border-b border-slate-100 last:border-b-0">
                      <div 
                        className="flex items-center justify-between px-4 md:px-5 py-3 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => onViewPlayers(team.id, null, `${team.name} - Sem Categoria`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">Sem Categoria</span>
                            <span className="ml-2 text-sm text-slate-500">
                              ({team.uncategorizedPlayers.length} atletas)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQuickAddPlayer({ teamId: team.id, categoryId: null });
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Adicionar atleta rápido"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Quick inline player list */}
                      {team.uncategorizedPlayers.length > 0 && (
                        <div className="px-4 md:px-5 py-2 bg-slate-50/50">
                          <div className="flex flex-wrap gap-2">
                            {team.uncategorizedPlayers.slice(0, 5).map((player) => (
                              <div
                                key={player.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200 text-sm"
                              >
                                {player.jersey_number && (
                                  <span className="font-semibold text-emerald-600">#{player.jersey_number}</span>
                                )}
                                <span className="text-slate-700">{player.name.split(' ')[0]}</span>
                              </div>
                            ))}
                            {team.uncategorizedPlayers.length > 5 && (
                              <span className="inline-flex items-center px-2.5 py-1 text-sm text-slate-500">
                                +{team.uncategorizedPlayers.length - 5} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Categories */}
                  {team.categories.map((category) => (
                    <div key={category.id} className="border-b border-slate-100 last:border-b-0">
                      {/* Category Header */}
                      <div 
                        className="flex items-center justify-between px-4 md:px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleCategory(team.id, category.id)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="p-0.5">
                            {category.isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-4 h-4 text-purple-600" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{category.name}</span>
                              {category.gender && (
                                <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                                  {category.gender === 'masculino' ? '♂' : category.gender === 'feminino' ? '♀' : '⚥'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>{category.player_count || 0} atletas</span>
                              {category.age_group && (
                                <>
                                  <span>•</span>
                                  <span>{category.age_group}</span>
                                </>
                              )}
                              {category.season && (
                                <>
                                  <span>•</span>
                                  <span>{category.season}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQuickAddPlayer({ teamId: team.id, categoryId: category.id });
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Adicionar atleta rápido"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewPlayers(team.id, category.id, category.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver todos os atletas"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Players */}
                      {category.isExpanded && category.players.length > 0 && (
                        <div className="px-4 md:px-5 py-2 pl-12 md:pl-14 bg-slate-50/50">
                          <div className="flex flex-wrap gap-2">
                            {category.players.slice(0, 5).map((player) => (
                              <div
                                key={player.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200 text-sm"
                              >
                                {player.jersey_number && (
                                  <span className="font-semibold text-emerald-600">#{player.jersey_number}</span>
                                )}
                                <span className="text-slate-700">{player.name.split(' ')[0]}</span>
                                {player.position && (
                                  <span className="text-xs text-slate-400">({player.position})</span>
                                )}
                              </div>
                            ))}
                            {category.players.length > 5 && (
                              <button
                                onClick={() => onViewPlayers(team.id, category.id, category.name)}
                                className="inline-flex items-center px-2.5 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                              >
                                +{category.players.length - 5} mais
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Category Button */}
                  <div className="px-4 md:px-5 py-3 bg-slate-50/50">
                    <button
                      onClick={() => onViewTeamDetail(team.id)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar categoria
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Player Modal */}
      {showQuickAddPlayer && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={() => setShowQuickAddPlayer(null)}
        >
          <div 
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-sm animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Adicionar Atleta</h3>
            </div>
            
            <form onSubmit={handleQuickAddPlayer} className="p-4">
              <input
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                placeholder="Nome do atleta"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
                required
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickAddPlayer(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading || !quickAddName.trim()}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {quickAddLoading ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={() => setShowCreateTeamModal(false)}
        >
          <div 
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">Criar Novo Time</h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do Time *
                </label>
                <input
                  type="text"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Futsal Feminino Vila Nova"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Esporte *
                </label>
                <select
                  value={teamFormData.sport}
                  onChange={(e) => setTeamFormData({ ...teamFormData, sport: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="futsal">Futsal</option>
                  <option value="futebol">Futebol</option>
                  <option value="volei">Vôlei</option>
                  <option value="basquete">Basquete</option>
                  <option value="handebol">Handebol</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Temporada
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2099"
                  value={teamFormData.season}
                  onChange={(e) => setTeamFormData({ ...teamFormData, season: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={teamFormData.notes}
                  onChange={(e) => setTeamFormData({ ...teamFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {creating ? 'Criando...' : 'Criar Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeLimitModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        limitType="teams"
        currentTier={subscription?.subscription_tier || 'free'}
        currentCount={activeTeamsCount}
        limit={teamLimit}
        onUpgrade={() => onUpgradeClick && onUpgradeClick()}
      />
    </div>
  );
};

export default TeamHierarchy;

