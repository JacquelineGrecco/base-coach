import React, { useState, useEffect } from 'react';
import { VALENCES } from '../constants';
import { ChevronRight, AlertCircle, CheckCircle2, Users, Folder } from 'lucide-react';
import { teamService, Team } from '../services/teamService';
import { categoryService } from '../services/categoryService';
import { supabase } from '../lib/supabase';

interface SessionSetupProps {
  onStartSession: (sessionData: {
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
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

const SessionSetup: React.FC<SessionSetupProps> = ({ onStartSession, onCancel, onNavigateToTeams }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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

  const toggleValence = (valenceId: string) => {
    if (selectedValences.includes(valenceId)) {
      setSelectedValences(selectedValences.filter(id => id !== valenceId));
    } else {
      if (selectedValences.length < 3) {
        setSelectedValences([...selectedValences, valenceId]);
      }
    }
  };

  const handleStart = () => {
    if (selectedValences.length === 0 || !selectedTeamId) return;
    
    onStartSession({
      teamId: selectedTeamId,
      categoryId: selectedCategoryId === 'no-category' ? null : selectedCategoryId,
      selectedValenceIds: selectedValences,
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
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {noTeams ? 'Nenhum time encontrado' : 
             noPlayers ? 'Nenhum atleta encontrado' :
             error}
          </h3>
          <p className="text-slate-600 mb-6">
            {noTeams 
              ? 'Você precisa criar um time antes de iniciar uma sessão.'
              : noPlayers
              ? 'Adicione atletas ao seu time antes de iniciar uma sessão de treino.'
              : 'Você precisa criar um time com atletas antes de iniciar uma sessão.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Voltar ao Dashboard
            </button>
            {(noTeams || noPlayers) && onNavigateToTeams && (
              <button
                onClick={onNavigateToTeams}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                {noTeams ? 'Criar Time' : 'Adicionar Atletas'}
              </button>
            )}
          </div>
        </div>
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

        {/* Selection Counter */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedValences.length === 3 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-semibold text-slate-900">
                {selectedValences.length} of 3 criteria selected
              </span>
            </div>
            <span className="text-sm text-slate-600">
              {selectedValences.length === 0 && "Select at least 1 criterion"}
              {selectedValences.length > 0 && selectedValences.length < 3 && "Add more criteria or start"}
              {selectedValences.length === 3 && "Maximum reached - ready to start!"}
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
                  const isDisabled = !isSelected && selectedValences.length >= 3;
                  
                  return (
                    <button
                      key={valence.id}
                      onClick={() => toggleValence(valence.id)}
                      disabled={isDisabled}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all transform
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' 
                          : isDisabled
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
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
            className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            disabled={selectedValences.length === 0 || playerCount === 0}
            className={`
              px-8 py-2.5 rounded-lg font-semibold flex items-center transition-all
              ${selectedValences.length === 0 || playerCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:scale-105'
              }
            `}
            title={playerCount === 0 ? 'Adicione atletas ao time primeiro' : ''}
          >
            Iniciar Sessão
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Helper Text */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-slate-600 text-center">
            💡 <strong>Dica:</strong> Selecionar menos critérios (1-3) permite avaliação mais rápida durante o treino. 
            Você pode focar em critérios diferentes em cada sessão.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;

