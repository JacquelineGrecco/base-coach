'use client';

import React, { useState, useEffect } from 'react';
import { VALENCES } from '@/lib/constants';
import { ChevronRight, AlertCircle, CheckCircle2, Users, Folder, UserCheck, UserX } from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';
import { categoryService } from '@/features/roster/services/categoryService';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';

interface SessionSetupProps {
  onStartSession: (sessionData: {
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
    presentPlayerIds: string[]; // Added for attendance tracking
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

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadCategories(selectedTeamId);
      loadPlayerCount(selectedTeamId, selectedCategoryId);
      loadPlayers(selectedTeamId, selectedCategoryId); // Load players for selection
    }
  }, [selectedTeamId, selectedCategoryId]);

  async function loadTeams() {
    setLoading(true);
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
    } else {
      setError('Nenhum time encontrado. Crie um time primeiro.');
    }
    
    setLoading(false);
  }

  async function loadCategories(teamId: string) {
    const { categories: categoriesData } = await categoryService.getCategoriesByTeam(teamId);
    
    // Load player count for total team and no-category players
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
    
    // Load player count for each category
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
      
      // Only show categories that have players
      const nonEmptyCategories = categoriesWithCount.filter(cat => (cat.player_count || 0) > 0);
      setCategories(nonEmptyCategories);
    } else {
      setCategories([]);
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
      } else {
        // If "All players" is selected, don't filter by category
        // But if a specific "no category" is selected, filter for null
        if (selectedCategoryId === 'no-category') {
          query = query.is('category_id', null);
        }
      }

      const { count } = await query;
      setPlayerCount(count || 0);
    } catch (error: any) {
      console.error('Error loading player count:', error);
    }
  }

  async function loadPlayers(teamId: string, categoryId: string | null) {
    try {
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
        setPlayers([]);
        return;
      }

      const playersData = (data || []) as Player[];
      setPlayers(playersData);
      // Auto-select all players by default
      setSelectedPlayerIds(playersData.map(p => p.id));
    } catch (error: any) {
      console.error('Error loading players:', error);
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

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || teams.length === 0 || totalTeamPlayerCount === 0) {
    const noTeams = teams.length === 0;
    const noPlayers = totalTeamPlayerCount === 0;
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Configurar Sessão de Treino</h2>
          <p className="text-blue-100">Selecione o time, categoria (opcional) e até 3 critérios para avaliar</p>
        </div>

        {/* Team and Category Selection */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          {/* Team Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Time *
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedCategoryId(null); // Reset category when team changes
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.player_count || 0} atletas)
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Folder className="w-4 h-4 inline mr-1" />
              Categoria (opcional)
            </label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {totalTeamPlayerCount > 0 && (
                <option value="">Todos os Atletas do Time ({totalTeamPlayerCount} atletas)</option>
              )}
              {noCategoryPlayerCount > 0 && (
                <option value="no-category">Sem Categoria ({noCategoryPlayerCount} atletas)</option>
              )}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.gender && `(${category.gender === 'masculino' ? '♂' : category.gender === 'feminino' ? '♀' : '⚥'})`}
                  {category.player_count !== undefined && ` - ${category.player_count} atletas`}
                </option>
              ))}
            </select>
            {categories.length === 0 && noCategoryPlayerCount === 0 && totalTeamPlayerCount > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Todos os atletas estão em categorias sem atletas ativos
              </p>
            )}
            {(categories.length > 0 || noCategoryPlayerCount > 0) && (
              <p className="text-xs text-slate-500 mt-1">
                Apenas categorias com atletas estão disponíveis
              </p>
            )}
          </div>

          {/* Player Count Badge */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm font-medium text-slate-700">Atletas selecionados:</span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
              {playerCount}
            </span>
          </div>
        </div>

        {/* Player Presence Selection */}
        {players.length > 0 && (
          <div className="p-6 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Presença dos Atletas
              </h3>
              <button
                onClick={toggleAllPlayers}
                className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                {selectedPlayerIds.length === players.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Marque os atletas que estão <strong>presentes</strong> no treino. Apenas atletas marcados serão avaliados.
            </p>

            {/* Player Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
              {players.map((player) => {
                const isPresent = selectedPlayerIds.includes(player.id);
                
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${isPresent
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                      }
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Checkbox Visual */}
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${isPresent
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-300 bg-white'
                          }
                        `}>
                          {isPresent && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {player.jersey_number && (
                              <span className="text-emerald-600 font-bold mr-1.5">
                                #{player.jersey_number}
                              </span>
                            )}
                            {player.name}
                          </div>
                          {player.position && (
                            <div className="text-xs text-slate-500 truncate">
                              {player.position}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Icon */}
                      <div className="ml-2">
                        {isPresent ? (
                          <UserCheck className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <UserX className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary Bar */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Atletas presentes:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {selectedPlayerIds.length}
                </span>
                <span className="text-sm text-slate-500">/ {players.length}</span>
              </div>
            </div>

            {selectedPlayerIds.length === 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Selecione pelo menos 1 atleta para iniciar a sessão
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selection Counter */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedValences.length > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-semibold text-slate-900">
                {selectedValences.length} {selectedValences.length === 1 ? 'critério selecionado' : 'critérios selecionados'}
              </span>
            </div>
            <span className="text-sm text-slate-600">
              {selectedValences.length === 0 && "Selecione pelo menos 1 critério"}
              {selectedValences.length > 0 && selectedValences.length <= 3 && "Recomendado: 1-3 critérios para avaliação rápida"}
              {selectedValences.length > 3 && `${selectedValences.length} critérios selecionados - avaliação detalhada`}
            </span>
          </div>
        </div>

        {/* Valence Selection Grid */}
        <div className="p-6 space-y-6">
          {Object.entries(valencesByCategory).map(([category, valences]) => (
            <div key={category}>
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center ${
                category === 'Technical' ? 'text-blue-700' :
                category === 'Physical' ? 'text-red-700' :
                category === 'Tactical' ? 'text-purple-700' :
                'text-yellow-700'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  category === 'Technical' ? 'bg-blue-500' :
                  category === 'Physical' ? 'bg-red-500' :
                  category === 'Tactical' ? 'bg-purple-500' :
                  'bg-yellow-500'
                }`}></span>
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {valences.map((valence) => {
                  const isSelected = selectedValences.includes(valence.id);
                  
                  return (
                    <button
                      key={valence.id}
                      onClick={() => toggleValence(valence.id)}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all transform
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{valence.name}</div>
                          <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                            category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                            category === 'Physical' ? 'bg-red-100 text-red-700' :
                            category === 'Tactical' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {category}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="h-12 px-6 py-3 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            disabled={selectedValences.length === 0 || playerCount === 0 || selectedPlayerIds.length === 0}
            className={`
              h-12 px-8 py-3 rounded-lg font-semibold flex items-center transition-all duration-200 active:scale-95
              ${selectedValences.length === 0 || playerCount === 0 || selectedPlayerIds.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:scale-105'
              }
            `}
            title={
              playerCount === 0 ? 'Adicione atletas ao time primeiro' :
              selectedPlayerIds.length === 0 ? 'Marque pelo menos 1 atleta presente' :
              ''
            }
          >
            Iniciar Sessão
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Helper Text */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-slate-800 text-center">
            💡 <strong>Dica:</strong> Recomendamos 1-3 critérios para avaliação rápida durante o treino, 
            mas você pode selecionar quantos quiser para uma análise mais detalhada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;

