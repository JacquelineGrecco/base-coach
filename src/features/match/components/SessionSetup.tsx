'use client';

import React, { useState, useEffect } from 'react';
import { VALENCES } from '@/lib/constants';
import { ChevronRight, AlertCircle, CheckCircle2, Users, Folder, UserCheck, UserX, Check, X, Save, RotateCcw } from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';
import { categoryService } from '@/features/roster/services/categoryService';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';

interface SessionSetupProps {
  onStartSession: (sessionData: {
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
    presentPlayerIds: string[];
  }) => void;
  onCancel: () => void;
  onNavigateToTeams?: () => void;
}

interface Category {
  id: string;
  name: string;
  gender?: string;
  player_count?: number;
}

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
  position?: string;
}

const SAVED_VALENCES_KEY = 'basecoach_saved_valences';

const SessionSetup: React.FC<SessionSetupProps> = ({ onStartSession, onCancel, onNavigateToTeams }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [noCategoryPlayerCount, setNoCategoryPlayerCount] = useState(0);
  const [totalTeamPlayerCount, setTotalTeamPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedValences, setSelectedValences] = useState<string[]>([]);
  const [hasSavedDefaults, setHasSavedDefaults] = useState(false);

  // Load saved valence defaults on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_VALENCES_KEY);
    if (saved) {
      try {
        const savedValences = JSON.parse(saved);
        if (Array.isArray(savedValences) && savedValences.length > 0) {
          // Validate that saved valences still exist
          const validValences = savedValences.filter((id: string) => 
            VALENCES.some(v => v.id === id)
          );
          if (validValences.length > 0) {
            setSelectedValences(validValences);
            setHasSavedDefaults(true);
          }
        }
      } catch (e) {
        console.error('Error loading saved valences:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadCategories(selectedTeamId);
      loadPlayerCount(selectedTeamId, selectedCategoryId);
      loadPlayers(selectedTeamId, selectedCategoryId);
    }
  }, [selectedTeamId, selectedCategoryId]);

  async function loadTeams() {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sessão expirada. Por favor, recarregue a página.');
        setLoading(false);
        return;
      }

      const { teams: teamsData, error: teamsError } = await teamService.getTeams();

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
        if (teamsError.message?.includes('session') || teamsError.message?.includes('JWT')) {
          setError('Sessão expirada. Por favor, recarregue a página e faça login novamente.');
        } else {
          setError('Erro ao carregar times: ' + teamsError.message);
        }
        setLoading(false);
        return;
      }

      setTeams(teamsData || []);
      
      if (teamsData && teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id);
      } else {
        setError('Nenhum time encontrado. Crie um time primeiro.');
      }
    } catch (error: any) {
      console.error('Error in loadTeams:', error);
      setError('Erro ao carregar times. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories(teamId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when loading categories');
        return;
      }

      const { categories: categoriesData } = await categoryService.getCategoriesByTeam(teamId);
      
      const { count: totalCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);
      
      const { count: noCatCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('category_id', null)
        .eq('is_active', true);
      
      setTotalTeamPlayerCount(totalCount || 0);
      setNoCategoryPlayerCount(noCatCount || 0);
      
      if (categoriesData && categoriesData.length > 0) {
        const categoriesWithCount = await Promise.all(
          categoriesData.map(async (category) => {
            const { count } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', teamId)
              .eq('category_id', category.id)
              .eq('is_active', true);
            
            return { ...category, player_count: count || 0 };
          })
        );
        
        const nonEmptyCategories = categoriesWithCount.filter(cat => (cat.player_count || 0) > 0);
        setCategories(nonEmptyCategories);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      if (error.message?.includes('session') || error.message?.includes('JWT')) {
        setError('Sessão expirada. Por favor, recarregue a página.');
      }
    }
  }

  async function loadPlayerCount(teamId: string, categoryId: string | null) {
    try {
      let query = supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else if (selectedCategoryId === 'no-category') {
        query = query.is('category_id', null);
      }

      const { count } = await query;
      setPlayerCount(count || 0);
    } catch (error: any) {
      console.error('Error loading player count:', error);
    }
  }

  async function loadPlayers(teamId: string, categoryId: string | null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when loading players');
        setError('Sessão expirada. Por favor, recarregue a página.');
        setPlayers([]);
        return;
      }

      let query = supabase
        .from('players')
        .select('id, name, jersey_number, position')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true });

      if (categoryId && categoryId !== 'no-category') {
        query = query.eq('category_id', categoryId);
      } else if (categoryId === 'no-category') {
        query = query.is('category_id', null);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading players:', error);
        if (error.message?.includes('session') || error.message?.includes('JWT') || error.code === 'PGRST301') {
          setError('Sessão expirada. Por favor, recarregue a página e faça login novamente.');
        } else {
          setError('Erro ao carregar atletas. Tente novamente.');
        }
        setPlayers([]);
        return;
      }

      const playersData = (data || []) as Player[];
      setPlayers(playersData);
      setSelectedPlayerIds(playersData.map(p => p.id));
    } catch (error: any) {
      console.error('Error loading players:', error);
      if (error.message?.includes('session') || error.message?.includes('Auth')) {
        setError('Sessão expirada. Por favor, recarregue a página.');
      } else {
        setError('Erro ao carregar atletas. Tente novamente.');
      }
      setPlayers([]);
    }
  }

  const toggleValence = (valenceId: string) => {
    if (selectedValences.includes(valenceId)) {
      setSelectedValences(selectedValences.filter(id => id !== valenceId));
    } else {
      setSelectedValences([...selectedValences, valenceId]);
    }
  };

  const selectAllValences = () => {
    setSelectedValences(VALENCES.map(v => v.id));
  };

  const clearAllValences = () => {
    setSelectedValences([]);
  };

  const saveValencesAsDefault = () => {
    if (selectedValences.length > 0) {
      localStorage.setItem(SAVED_VALENCES_KEY, JSON.stringify(selectedValences));
      setHasSavedDefaults(true);
    }
  };

  const loadSavedValences = () => {
    const saved = localStorage.getItem(SAVED_VALENCES_KEY);
    if (saved) {
      try {
        const savedValences = JSON.parse(saved);
        if (Array.isArray(savedValences)) {
          const validValences = savedValences.filter((id: string) => 
            VALENCES.some(v => v.id === id)
          );
          setSelectedValences(validValences);
        }
      } catch (e) {
        console.error('Error loading saved valences:', e);
      }
    }
  };

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };

  const toggleAllPlayers = () => {
    if (selectedPlayerIds.length === players.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(players.map(p => p.id));
    }
  };

  const handleStart = () => {
    if (selectedValences.length === 0 || !selectedTeamId || selectedPlayerIds.length === 0) return;
    
    onStartSession({
      teamId: selectedTeamId,
      categoryId: selectedCategoryId === 'no-category' ? null : selectedCategoryId,
      selectedValenceIds: selectedValences,
      presentPlayerIds: selectedPlayerIds,
    });
  };

  // Group valences by category
  const valencesByCategory = VALENCES.reduce((acc, valence) => {
    if (!acc[valence.category]) {
      acc[valence.category] = [];
    }
    acc[valence.category].push(valence);
    return acc;
  }, {} as Record<string, typeof VALENCES>);

  const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
    'Technical': { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500', light: 'bg-blue-50' },
    'Physical': { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-500', light: 'bg-red-50' },
    'Tactical': { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-500', light: 'bg-purple-50' },
    'Mental': { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500', light: 'bg-yellow-50' },
  };

  const canStart = selectedValences.length > 0 && selectedTeamId && selectedPlayerIds.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || teams.length === 0 || totalTeamPlayerCount === 0) {
    const noTeams = teams.length === 0;
    const noPlayers = totalTeamPlayerCount === 0;
    
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title={noTeams ? 'Nenhum time encontrado' : 
                 noPlayers ? 'Nenhum atleta encontrado' :
                 'Erro'}
          description={noTeams 
            ? 'Você precisa criar um time antes de iniciar uma sessão.'
            : noPlayers
            ? 'Adicione atletas ao seu time antes de iniciar uma sessão de treino.'
            : error || 'Você precisa criar um time com atletas antes de iniciar uma sessão.'}
          variant={noTeams || noPlayers ? 'info' : 'error'}
          action={(noTeams || noPlayers) && onNavigateToTeams ? {
            label: noTeams ? 'Criar Time' : 'Adicionar Atletas',
            onClick: onNavigateToTeams,
            icon: Users,
            variant: 'success',
          } : undefined}
          secondaryAction={{
            label: 'Voltar ao Dashboard',
            onClick: onCancel,
            variant: 'secondary',
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-1">Nova Sessão de Treino</h2>
          <p className="text-blue-100 text-sm md:text-base">Configure o time, atletas e critérios de avaliação</p>
        </div>

        {/* Team and Category Selection */}
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Time
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setSelectedCategoryId(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.player_count || 0} atletas)
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Folder className="w-4 h-4" />
                Categoria (opcional)
              </label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {totalTeamPlayerCount > 0 && (
                  <option value="">Todos os Atletas ({totalTeamPlayerCount})</option>
                )}
                {noCategoryPlayerCount > 0 && (
                  <option value="no-category">Sem Categoria ({noCategoryPlayerCount})</option>
                )}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.gender && `(${category.gender === 'masculino' ? '♂' : category.gender === 'feminino' ? '♀' : '⚥'})`}
                    {category.player_count !== undefined && ` - ${category.player_count}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Player Presence Selection */}
        {players.length > 0 && (
          <div className="p-4 md:p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Presença
              </h3>
              <button
                onClick={toggleAllPlayers}
                className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                {selectedPlayerIds.length === players.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Marque os atletas <strong>presentes</strong> no treino.
            </p>

            {/* Compact Player Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {players.map((player) => {
                const isPresent = selectedPlayerIds.includes(player.id);
                
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`
                      p-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.98]
                      ${isPresent
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isPresent
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 bg-white'
                        }
                      `}>
                        {isPresent && <Check className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate">
                          {player.jersey_number && (
                            <span className="text-emerald-600 font-bold mr-1">
                              #{player.jersey_number}
                            </span>
                          )}
                          {player.name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Presentes:</span>
              <span className="text-lg font-bold text-emerald-600">
                {selectedPlayerIds.length} / {players.length}
              </span>
            </div>

            {selectedPlayerIds.length === 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Selecione pelo menos 1 atleta
                </p>
              </div>
            )}
          </div>
        )}

        {/* Valence Selection */}
        <div className="p-4 md:p-6">
          {/* Valence Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Critérios de Avaliação</h3>
              <p className="text-sm text-slate-600">
                {selectedValences.length === 0 
                  ? 'Selecione os critérios para avaliar' 
                  : `${selectedValences.length} critério${selectedValences.length > 1 ? 's' : ''} selecionado${selectedValences.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAllValences}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Selecionar Todos
              </button>
              <button
                onClick={clearAllValences}
                disabled={selectedValences.length === 0}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
              >
                Limpar
              </button>
              {hasSavedDefaults && (
                <button
                  onClick={loadSavedValences}
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Padrão
                </button>
              )}
              {selectedValences.length > 0 && (
                <button
                  onClick={saveValencesAsDefault}
                  className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium flex items-center gap-1"
                  title="Salvar como padrão para próximas sessões"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </button>
              )}
            </div>
          </div>

          {/* Valence Grid by Category */}
          <div className="space-y-4">
            {Object.entries(valencesByCategory).map(([category, valences]) => {
              const colors = categoryColors[category] || categoryColors['Technical'];
              const selectedInCategory = valences.filter(v => selectedValences.includes(v.id)).length;
              
              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <span className={`text-sm font-semibold uppercase tracking-wide ${colors.text}`}>
                        {category}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({selectedInCategory}/{valences.length})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedInCategory === valences.length) {
                          // Deselect all in category
                          setSelectedValences(selectedValences.filter(id => !valences.some(v => v.id === id)));
                        } else {
                          // Select all in category
                          const categoryIds = valences.map(v => v.id);
                          setSelectedValences([...new Set([...selectedValences, ...categoryIds])]);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {selectedInCategory === valences.length ? 'Desmarcar' : 'Marcar todos'}
                    </button>
                  </div>
                  
                  {/* Valence Chips */}
                  <div className="flex flex-wrap gap-2">
                    {valences.map((valence) => {
                      const isSelected = selectedValences.includes(valence.id);
                      
                      return (
                        <button
                          key={valence.id}
                          onClick={() => toggleValence(valence.id)}
                          className={`
                            px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98]
                            ${isSelected 
                              ? `${colors.light} ${colors.text} border-2 ${colors.border} shadow-sm` 
                              : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="w-4 h-4" />}
                            {valence.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons - Fixed on Mobile */}
        <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 p-4 md:px-6 md:py-4 bg-white border-t border-slate-200 flex justify-between items-center gap-3 z-40">
          <button
            onClick={onCancel}
            className="flex-1 md:flex-none h-12 px-6 text-slate-700 hover:text-slate-900 font-medium transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`
              flex-1 md:flex-none h-12 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95
              ${!canStart
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
              }
            `}
          >
            Iniciar Treino
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Tip */}
        <div className="hidden md:block px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-slate-700 text-center">
            💡 <strong>Dica:</strong> Use "Salvar" para guardar seus critérios favoritos e carregá-los rapidamente nas próximas sessões.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;
