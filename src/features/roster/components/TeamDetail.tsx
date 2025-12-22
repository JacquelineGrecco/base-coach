'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Edit2, Archive, Trash2, AlertCircle, CheckCircle, Folder } from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';
import { categoryService, Category } from '@/features/roster/services/categoryService';

interface TeamDetailProps {
  teamId: string;
  onBack: () => void;
  onViewPlayers: (categoryId: string | null, categoryName: string) => void;
}

const TeamDetail: React.FC<TeamDetailProps> = ({ teamId, onBack, onViewPlayers }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamLevelPlayerCount, setTeamLevelPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age_group: '',
    season: new Date().getFullYear().toString(),
    gender: '' as 'masculino' | 'feminino' | 'misto' | '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  async function loadTeamData() {
    setLoading(true);
    
    // Load team
    const { team: teamData, error: teamError } = await teamService.getTeam(teamId);
    if (teamError) {
      setError('Erro ao carregar time: ' + teamError.message);
    } else {
      setTeam(teamData);
    }

    // Load categories
    const { categories: categoriesData, error: categoriesError } = await categoryService.getCategoriesByTeam(teamId);
    if (categoriesError) {
      setError('Erro ao carregar categorias: ' + categoriesError.message);
    } else {
      setCategories(categoriesData || []);
    }

    // Load team-level players count
    const { players, error: playersError } = await teamService.getTeamLevelPlayers(teamId);
    if (!playersError && players) {
      setTeamLevelPlayerCount(players.length);
    }

    setLoading(false);
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Por favor, preencha o nome da categoria');
      return;
    }

    if (!formData.gender) {
      setError('Por favor, selecione o gênero da categoria');
      return;
    }

    setError('');
    setCreating(true);

    const { category, error } = await categoryService.createCategory(teamId, {
      name: formData.name,
      age_group: formData.age_group || undefined,
      season: formData.season || undefined,
      gender: formData.gender as 'masculino' | 'feminino' | 'misto',
      notes: formData.notes || undefined,
    });

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setError(`Já existe uma categoria chamada "${formData.name}" neste time.`);
      } else {
        setError('Erro ao criar categoria: ' + error.message);
      }
    } else {
      setSuccess('Categoria criada com sucesso!');
      setShowCreateCategory(false);
      setFormData({
        name: '',
        age_group: '',
        season: new Date().getFullYear().toString(),
        gender: '',
        notes: '',
      });
      loadTeamData();
      
      setTimeout(() => setSuccess(''), 3000);
    }

    setCreating(false);
  }

  async function handleArchiveCategory(categoryId: string) {
    if (!confirm('Tem certeza que deseja arquivar esta categoria?\n\nTodos os atletas desta categoria também serão arquivados.\n\n⏰ Items arquivados são excluídos permanentemente após 7 dias.')) return;

    const { error } = await categoryService.archiveCategory(categoryId);

    if (error) {
      setError('Erro ao arquivar categoria: ' + error.message);
    } else {
      setSuccess('Categoria arquivada! Será excluída em 7 dias.');
      loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm('⚠️ ATENÇÃO: Esta ação é PERMANENTE!\n\nDeseja realmente EXCLUIR esta categoria?\n\nTodos os atletas desta categoria também serão EXCLUÍDOS permanentemente.\n\nEsta ação NÃO pode ser desfeita.')) return;

    const { error } = await categoryService.deleteCategory(categoryId);

    if (error) {
      setError('Erro ao excluir categoria: ' + error.message);
    } else {
      setSuccess('Categoria e atletas excluídos permanentemente!');
      loadTeamData();
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      age_group: category.age_group || '',
      season: category.season || new Date().getFullYear().toString(),
      gender: category.gender || '',
      notes: category.notes || '',
    });
    setShowEditCategory(true);
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    
    if (!editingCategory || !formData.name.trim()) {
      setError('Por favor, preencha o nome da categoria');
      return;
    }

    setError('');
    setUpdating(true);

    const { error } = await categoryService.updateCategory(editingCategory.id, {
      name: formData.name,
      age_group: formData.age_group || undefined,
      season: formData.season || undefined,
      gender: formData.gender || undefined,
      notes: formData.notes || undefined,
    });

    if (error) {
      setError('Erro ao atualizar categoria: ' + error.message);
    } else {
      setSuccess('Categoria atualizada com sucesso!');
      setShowEditCategory(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        age_group: '',
        season: new Date().getFullYear().toString(),
        gender: '',
        notes: '',
      });
      loadTeamData();
      
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

  if (!team) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Time não encontrado</h3>
          <button
            onClick={onBack}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Voltar para Times
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Times
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
            <p className="text-gray-600 capitalize">
              {team.sport} • Temporada {team.season}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Editar time"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
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

      {/* Team-Level Players Card (Players without category) - Always show */}
      <div
        onClick={() => onViewPlayers(null, `${team.name} - Sem Categoria`)}
        className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sem Categoria</h3>
              <p className="text-sm text-gray-600">
                {teamLevelPlayerCount === 0 
                  ? 'Adicione atletas sem categoria específica'
                  : `${teamLevelPlayerCount} ${teamLevelPlayerCount === 1 ? 'atleta' : 'atletas'}`
                }
              </p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
        <button
          onClick={() => setShowCreateCategory(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma categoria criada
          </h3>
          <p className="text-gray-600 mb-4">
            Organize seus atletas em categorias como Sub-12, Sub-15, etc.
          </p>
          <button
            onClick={() => setShowCreateCategory(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Categoria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => onViewPlayers(category.id, category.name)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                    {category.name}
                  </h3>
                  {category.age_group && (
                    <p className="text-sm text-gray-600">
                      {category.age_group}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {category.player_count || 0} atletas
                </span>
              </div>

              {/* Notes */}
              {category.notes && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {category.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchiveCategory(category.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-gray-600 hover:text-orange-600 text-sm"
                  title="Arquivar categoria e atletas"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-gray-600 hover:text-red-600 text-sm"
                  title="Excluir permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateCategory(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Nova Categoria
              </h3>
              <button
                onClick={() => setShowCreateCategory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Sub-12, Juvenil, Feminino A"
                  required
                />
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faixa Etária
                </label>
                <input
                  type="text"
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: U-12, 10-12 anos"
                />
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

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="misto">Misto</option>
                </select>
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
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCategory(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && editingCategory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditCategory(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Categoria
              </h3>
              <button
                onClick={() => setShowEditCategory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Sub-12, Juvenil, Feminino A"
                  required
                />
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faixa Etária
                </label>
                <input
                  type="text"
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: U-12, 10-12 anos"
                />
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

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="misto">Misto</option>
                </select>
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
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditCategory(false)}
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
    </div>
  );
};

export default TeamDetail;

