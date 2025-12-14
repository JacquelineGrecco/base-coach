import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Edit2, Trash2, AlertCircle, CheckCircle, UserX, Lock, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { subscriptionService, SubscriptionInfo } from '../../services/subscriptionService';

// Futsal positions
export type PlayerPosition = 'Goleiro' | 'Fixo' | 'Ala' | 'Pivô';

interface Player {
  id: string;
  team_id: string;
  category_id: string | null;
  name: string;
  position?: PlayerPosition | '';
  jersey_number?: number;
  birth_date?: string;
  dominant_leg?: 'Esquerda' | 'Direita' | 'Ambos' | '';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PlayersProps {
  teamId: string;
  categoryId: string | null;
  categoryName: string;
  onBack: () => void;
  onUpgradeClick?: () => void;
}

interface Category {
  id: string;
  name: string;
  gender?: string;
}

const Players: React.FC<PlayersProps> = ({ teamId, categoryId, categoryName, onBack, onUpgradeClick }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    jersey_number: '',
    birth_date: '',
    dominant_leg: '',
    notes: '',
    category_id: categoryId || '',
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Helper function to calculate age from birth date
  function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  useEffect(() => {
    loadPlayers();
    loadCategories();
    loadSubscription();
  }, [teamId, categoryId]);

  async function loadSubscription() {
    const data = await subscriptionService.getUserSubscription();
    if (!data) {
      console.error('Error loading subscription');
    }
    setSubscription(data);
  }

  async function loadPlayers() {
    setLoading(true);
    
    try {
      let query = supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true, nullsFirst: false })
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else {
        query = query.is('category_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      setError('Erro ao carregar atletas: ' + error.message);
    }
    
    setLoading(false);
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, gender')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
    }
  }

  async function validateJerseyNumber(jerseyNumber: string, excludePlayerId?: string): Promise<boolean> {
    if (!jerseyNumber) return true; // Optional field

    const number = parseInt(jerseyNumber);
    if (isNaN(number) || number < 0 || number > 99) {
      setError('Número da camisa deve estar entre 0 e 99');
      return false;
    }

    // Check if number is already taken in this team
    try {
      let query = supabase
        .from('players')
        .select('id, name, jersey_number')
        .eq('team_id', teamId)
        .eq('jersey_number', number)
        .eq('is_active', true);

      if (excludePlayerId) {
        query = query.neq('id', excludePlayerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const existingPlayer = data[0] as any;
        setError(`Número ${number} já está sendo usado por ${existingPlayer.name}`);
        return false;
      }

      return true;
    } catch (error: any) {
      setError('Erro ao validar número: ' + error.message);
      return false;
    }
  }

  function validateBirthDate(dateString: string): boolean {
    if (!dateString) return true; // Optional field

    const date = new Date(dateString);
    const today = new Date();
    const maxAge = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
    const minAge = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

    if (isNaN(date.getTime())) {
      setError('Data de nascimento inválida');
      return false;
    }

    if (date > minAge) {
      setError('Atleta deve ter pelo menos 5 anos');
      return false;
    }

    if (date < maxAge) {
      setError('Data de nascimento muito antiga. Verifique o ano.');
      return false;
    }

    return true;
  }

  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Por favor, preencha o nome do atleta');
      return;
    }

    // Validate jersey number
    if (formData.jersey_number) {
      const isValid = await validateJerseyNumber(formData.jersey_number);
      if (!isValid) {
        setCreating(false);
        return;
      }
    }

    // Validate birth date
    if (formData.birth_date && !validateBirthDate(formData.birth_date)) {
      setCreating(false);
      return;
    }

    setError('');
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          team_id: teamId,
          category_id: categoryId,
          name: formData.name,
          position: formData.position || null,
          jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
          birth_date: formData.birth_date || null,
          dominant_leg: formData.dominant_leg || null,
          notes: formData.notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setSuccess('Atleta adicionado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        position: '',
        jersey_number: '',
        birth_date: '',
        dominant_leg: '',
        notes: '',
        category_id: categoryId || '',
      });
      loadPlayers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Erro ao criar atleta: ' + error.message);
    }

    setCreating(false);
  }

  function handleEditPlayer(player: Player) {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position || '',
      jersey_number: player.jersey_number?.toString() || '',
      birth_date: player.birth_date || '',
      dominant_leg: player.dominant_leg || '',
      notes: player.notes || '',
      category_id: player.category_id || '',
    });
    setShowEditModal(true);
  }

  async function handleUpdatePlayer(e: React.FormEvent) {
    e.preventDefault();
    
    if (!editingPlayer || !formData.name.trim()) {
      setError('Por favor, preencha o nome do atleta');
      return;
    }

    // Validate jersey number (exclude current player)
    if (formData.jersey_number) {
      const isValid = await validateJerseyNumber(formData.jersey_number, editingPlayer.id);
      if (!isValid) {
        return;
      }
    }

    // Validate birth date
    if (formData.birth_date && !validateBirthDate(formData.birth_date)) {
      return;
    }

    setError('');
    setUpdating(true);

    try {
      const updates: any = {
        name: formData.name,
        position: formData.position || null,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        birth_date: formData.birth_date || null,
        dominant_leg: formData.dominant_leg || null,
        notes: formData.notes || null,
        category_id: formData.category_id || null,
        updated_at: new Date().toISOString(),
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', editingPlayer.id);

      if (error) throw error;

      // Check if player was moved to different category
      const wasMoved = editingPlayer.category_id !== (formData.category_id || null);
      
      setSuccess(wasMoved 
        ? 'Atleta atualizado e movido de categoria com sucesso!'
        : 'Atleta atualizado com sucesso!');
      setShowEditModal(false);
      setEditingPlayer(null);
      setFormData({
        name: '',
        position: '',
        jersey_number: '',
        birth_date: '',
        dominant_leg: '',
        notes: '',
        category_id: categoryId || '',
      });
      loadPlayers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Erro ao atualizar atleta: ' + error.message);
    }

    setUpdating(false);
  }

  async function handleDeactivatePlayer(playerId: string, playerName: string) {
    if (!confirm(`Desativar ${playerName}?\n\nO atleta será removido da lista ativa e será permanentemente excluído após 7 dias.`)) return;

    try {
      const now = new Date().toISOString();
      
      const updates: any = { 
        is_active: false,
        archived_at: now,
        updated_at: now
      };
      
      // @ts-ignore - Supabase update type inference issue
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId);

      if (error) throw error;

      setSuccess('Atleta desativado! Será excluído em 7 dias.');
      loadPlayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Erro ao desativar atleta: ' + error.message);
    }
  }

  async function handleDeletePlayer(playerId: string, playerName: string) {
    if (!confirm(`ATENÇÃO: Deletar permanentemente ${playerName}? Esta ação não pode ser desfeita!`)) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      setSuccess('Atleta deletado permanentemente!');
      loadPlayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Erro ao deletar atleta: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Get tier limits
  const tierLimits = subscription ? subscriptionService.getTierLimits(subscription.tier) : null;
  const playerLimit = tierLimits?.playersPerTeam || 15;
  const isUnlimited = playerLimit === Infinity;
  const atPlayerLimit = !isUnlimited && players.length >= playerLimit;

  function handleCreateButtonClick() {
    if (atPlayerLimit) {
      return; // Button will be disabled anyway
    }
    setShowCreateModal(true);
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
          Voltar
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
            <p className="text-gray-600">
              {players.length} {players.length === 1 ? 'atleta' : 'atletas'}
            </p>
          </div>
          
          <div className="text-right">
            {subscription && (
              <div className={`text-2xl font-bold mb-2 ${atPlayerLimit ? 'text-red-600' : 'text-slate-900'}`}>
                {isUnlimited ? (
                  <span className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    Ilimitado
                  </span>
                ) : (
                  <span>{players.length}/{playerLimit}</span>
                )}
              </div>
            )}
            <button
              onClick={handleCreateButtonClick}
              disabled={atPlayerLimit}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                atPlayerLimit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {atPlayerLimit ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              Adicionar Atleta
            </button>
            {atPlayerLimit && (
              <p className="text-xs text-red-600 mt-1">
                Limite atingido • <button onClick={() => onUpgradeClick && onUpgradeClick()} className="underline font-semibold">Fazer upgrade</button>
              </p>
            )}
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

      {/* Players List */}
      {players.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum atleta adicionado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando atletas a esta categoria.
          </p>
          <button
            onClick={handleCreateButtonClick}
            disabled={atPlayerLimit}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              atPlayerLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {atPlayerLimit ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            Adicionar Primeiro Atleta
          </button>
          {atPlayerLimit && (
            <p className="text-xs text-red-600 mt-2">
              Limite atingido • <button onClick={() => onUpgradeClick && onUpgradeClick()} className="underline font-semibold">Fazer upgrade</button>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Nome</div>
              <div className="col-span-3">Posição</div>
              <div className="col-span-2">Idade</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
          </div>

          {/* Players List */}
          <div className="divide-y divide-gray-200">
            {players.map((player) => (
              <div
                key={player.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Jersey Number */}
                  <div className="col-span-1">
                    {player.jersey_number ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                        {player.jersey_number}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-4">
                    <p className="font-medium text-gray-900">{player.name}</p>
                    {player.notes && (
                      <p className="text-xs text-gray-500 line-clamp-1">{player.notes}</p>
                    )}
                  </div>

                  {/* Position */}
                  <div className="col-span-3">
                    <span className="text-sm text-gray-600">
                      {player.position || '—'}
                    </span>
                  </div>

                  {/* Age */}
                  <div className="col-span-2">
                    {player.birth_date ? (
                      <span className="text-sm text-gray-600">
                        {calculateAge(player.birth_date)} anos
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeactivatePlayer(player.id, player.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Desativar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && editingPlayer && (
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
                Editar Atleta
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
            <form onSubmit={handleUpdatePlayer} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Jersey Number & Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Goleiro">Goleiro</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Ala">Ala</option>
                    <option value="Pivô">Pivô</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perna Dominante
                  </label>
                  <select
                    value={formData.dominant_leg}
                    onChange={(e) => setFormData({ ...formData, dominant_leg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Direita">Direita</option>
                    <option value="Esquerda">Esquerda</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Sem Categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.gender && `(${cat.gender === 'masculino' ? '♂' : cat.gender === 'feminino' ? '♀' : '⚥'})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.category_id && formData.category_id !== (categoryId || '') 
                    ? '⚠️ Atleta será movido para outra categoria'
                    : 'Altere para mover o atleta para outra categoria'}
                </p>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(new Date().getFullYear() - 50, 0, 1).toISOString().split('T')[0]}
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
                  placeholder="Informações adicionais sobre o atleta..."
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

      {/* Create Player Modal */}
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
                Adicionar Atleta
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
            <form onSubmit={handleCreatePlayer} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Jersey Number & Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Goleiro">Goleiro</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Ala">Ala</option>
                    <option value="Pivô">Pivô</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perna Dominante
                  </label>
                  <select
                    value={formData.dominant_leg}
                    onChange={(e) => setFormData({ ...formData, dominant_leg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Direita">Direita</option>
                    <option value="Esquerda">Esquerda</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  placeholder="Informações adicionais sobre o atleta..."
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
                  {creating ? 'Adicionando...' : 'Adicionar Atleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;

