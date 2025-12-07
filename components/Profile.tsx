import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, Trash2, AlertCircle, CheckCircle, Mail, Phone, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userService, UserProfile } from '../services/userService';

type TabType = 'personal' | 'plan';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Personal info form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    setLoading(true);
    const { profile: userProfile, error } = await userService.getUserProfile(user.id);
    
    if (error || !userProfile) {
      console.error('Failed to load profile:', error);
      setError('Erro ao carregar perfil. Sua conta pode ter sido deletada.');
      
      // Sign out if profile doesn't exist
      setTimeout(async () => {
        await signOut();
      }, 2000);
      
      setLoading(false);
      return;
    }

    if (userProfile) {
      setProfile(userProfile);
      setName(userProfile.name);
      setEmail(userProfile.email);
      setPhone(userProfile.phone || '');
    }
    
    setLoading(false);
  }

  async function handleUpdatePersonalInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    const { error } = await userService.updateProfile(user.id, {
      name,
      email,
      phone: phone || undefined,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Perfil atualizado com sucesso!');
      loadProfile(); // Reload profile
    }

    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setSaving(true);
    const { error } = await userService.changePassword(newPassword);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }

    setSaving(false);
  }

  async function handleChangePlan(planType: 'free' | 'basic' | 'premium') {
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    const { error } = await userService.updatePlanType(user.id, planType);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(`Plano alterado para ${planType.toUpperCase()} com sucesso!`);
      loadProfile();
    }

    setSaving(false);
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm !== 'DELETAR') {
      setError('Digite "DELETAR" para confirmar');
      return;
    }

    setError('');
    setSaving(true);

    const { error } = await userService.requestAccountDeletion(user.id, deleteReason);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      // User will be signed out automatically
      await signOut();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const TabButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: any; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setError('');
        setSuccess('');
      }}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors rounded-lg ${
        activeTab === tab
          ? 'bg-emerald-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          {profile && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              profile.user_type === 'coach' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {profile.user_type === 'coach' ? '🏆 Treinador' : '⚽ Atleta'}
            </span>
          )}
        </div>
        <p className="text-gray-600">Gerencie seu perfil e preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <TabButton tab="personal" icon={User} label="Informações Pessoais" />
        <TabButton tab="plan" icon={CreditCard} label="Plano" />
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Pessoais</h2>
            
            <form onSubmit={handleUpdatePersonalInfo} className="space-y-4 mb-8">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Você receberá um email de confirmação se alterar este campo
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>

            {/* Change Password Section */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Digite novamente"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !newPassword || !confirmPassword}
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
            </div>

            {/* Delete Account Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Deletar Conta
              </h3>
              
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2 font-semibold">
                  ⚠️ Atenção: Esta ação é irreversível!
                </p>
                <p className="text-sm text-red-800 mb-2">
                  Ao deletar sua conta, todos os seus dados serão permanentemente removidos:
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                  <li>Perfil e informações pessoais</li>
                  <li>Todos os times criados</li>
                  <li>Todos os jogadores cadastrados</li>
                  <li>Histórico de sessões e avaliações</li>
                  <li>Relatórios gerados</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da exclusão (opcional)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ajude-nos a melhorar. Por que você está saindo?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Digite "DELETAR" para confirmar
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="DELETAR"
                  />
                </div>

                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirm !== 'DELETAR'}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5" />
                  {saving ? 'Deletando...' : 'Deletar Minha Conta Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gerenciar Plano</h2>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Plano Atual:</strong> {profile?.plan_type?.toUpperCase() || 'FREE'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className={`border-2 rounded-lg p-6 ${profile?.plan_type === 'free' || !profile?.plan_type ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">R$ 0<span className="text-sm text-gray-600">/mês</span></p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li>✓ 1 time</li>
                  <li>✓ Até 15 jogadores</li>
                  <li>✓ Avaliações básicas</li>
                  <li>✗ Relatórios profissionais</li>
                </ul>
                {(profile?.plan_type === 'free' || !profile?.plan_type) ? (
                  <div className="text-center text-sm font-medium text-emerald-600">Plano Atual</div>
                ) : (
                  <button
                    onClick={() => handleChangePlan('free')}
                    disabled={saving}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Mudar para Free
                  </button>
                )}
              </div>

              {/* Basic Plan */}
              <div className={`border-2 rounded-lg p-6 ${profile?.plan_type === 'basic' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-2">Basic</h3>
                <p className="text-3xl font-bold mb-4">R$ 29<span className="text-sm text-gray-600">/mês</span></p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li>✓ 3 times</li>
                  <li>✓ Até 50 jogadores</li>
                  <li>✓ Avaliações completas</li>
                  <li>✓ Relatórios profissionais</li>
                </ul>
                {profile?.plan_type === 'basic' ? (
                  <div className="text-center text-sm font-medium text-emerald-600">Plano Atual</div>
                ) : (
                  <button
                    onClick={() => handleChangePlan('basic')}
                    disabled={saving}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Assinar Basic
                  </button>
                )}
              </div>

              {/* Premium Plan */}
              <div className={`border-2 rounded-lg p-6 ${profile?.plan_type === 'premium' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Premium</h3>
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">POPULAR</span>
                </div>
                <p className="text-3xl font-bold mb-4">R$ 79<span className="text-sm text-gray-600">/mês</span></p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li>✓ Times ilimitados</li>
                  <li>✓ Jogadores ilimitados</li>
                  <li>✓ IA avançada</li>
                  <li>✓ Venda de relatórios (70%)</li>
                </ul>
                {profile?.plan_type === 'premium' ? (
                  <div className="text-center text-sm font-medium text-emerald-600">Plano Atual</div>
                ) : (
                  <button
                    onClick={() => handleChangePlan('premium')}
                    disabled={saving}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Assinar Premium
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;

