'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, CreditCard, Trash2, AlertCircle, CheckCircle, Mail, Phone, Save, Camera, Download, FileText, ZoomIn, ZoomOut, Sparkles, TrendingUp, Crown } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { userService, UserProfile } from '@/features/roster/services/userService';
import { subscriptionService, SubscriptionInfo, TIER_INFO, TIER_FEATURES, TIER_LIMITS } from '@/features/auth/services/subscriptionService';

type TabType = 'personal' | 'plan';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image preview and crop
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Personal info form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadProfile();
    loadSubscription();
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
      setBio(userProfile.bio || '');
    }
    
    setLoading(false);
  }

  async function loadSubscription() {
    const sub = await subscriptionService.getUserSubscription();
    setSubscription(sub);

    if (sub?.status === 'trialing') {
      const daysLeft = await subscriptionService.getTrialDaysRemaining();
      setTrialDaysLeft(daysLeft);
    }
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
      bio: bio || undefined,
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

    const { error } = await userService.requestAccountDeactivation(user.id, deleteReason);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      // User will be signed out automatically
      await signOut();
    }
  }

  async function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem');
      return;
    }

    setError('');
    setSelectedFile(file);
    
    // Reset crop settings
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setShowImageModal(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  async function getCroppedImage(): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const image = imageRef.current;

      if (!canvas || !image) {
        reject(new Error('Canvas or image not found'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size to desired output (400x400 for profile pics)
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      // Calculate crop area
      const cropSize = 300; // Size of the crop area on screen
      const scale = image.naturalWidth / image.width;
      
      // Source dimensions (from original image)
      const sourceSize = cropSize * scale / zoom;
      const sourceX = (image.naturalWidth / 2 - sourceSize / 2) - (position.x * scale / zoom);
      const sourceY = (image.naturalHeight / 2 - sourceSize / 2) - (position.y * scale / zoom);

      // Draw circular crop
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }
          const croppedFile = new File([blob], selectedFile?.name || 'avatar.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        0.95
      );
    });
  }

  async function handleConfirmUpload() {
    if (!user || !selectedFile) return;

    setError('');
    setSuccess('');
    setUploading(true);
    setShowImageModal(false);

    try {
      // Get cropped image
      const croppedFile = await getCroppedImage();
      
      // Upload cropped image
      const { url, error } = await userService.uploadProfilePicture(user.id, croppedFile);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Foto atualizada com sucesso!');
        loadProfile(); // Reload to show new picture
      }
    } catch (error) {
      setError('Erro ao processar imagem');
      console.error(error);
    }

    setUploading(false);
    setImagePreview(null);
    setSelectedFile(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleCancelUpload() {
    setShowImageModal(false);
    setImagePreview(null);
    setSelectedFile(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  async function handleDeleteProfilePicture() {
    if (!user || !profile?.profile_picture_url) return;

    setError('');
    setSuccess('');
    setUploading(true);

    const { error } = await userService.deleteProfilePicture(user.id, profile.profile_picture_url);

    if (error) {
      setError(error.message);
      setUploading(false);
    } else {
      setSuccess('Foto removida com sucesso!');
      // Update profile state immediately to show initials
      setProfile({ ...profile, profile_picture_url: undefined });
      // Also reload from database
      await loadProfile();
      setUploading(false);
    }
  }

  async function handleConfirmExport() {
    if (!user) return;

    setError('');
    setExporting(true);
    setShowExportModal(false);

    if (exportFormat === 'json') {
      const { data, error } = await userService.exportUserData(user.id);

      if (error) {
        setError('Erro ao exportar dados: ' + error.message);
        setExporting(false);
        return;
      }

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basecoach-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Dados exportados em JSON com sucesso!');
      setExporting(false);
    } else {
      // CSV export - Check Pro+ access
      if (!subscription || !TIER_FEATURES[subscription.tier].csvExport) {
        setError('Exportar CSV é um recurso exclusivo do plano Pro. Faça upgrade para acessar!');
        setExporting(false);
        setTimeout(() => {
          window.location.href = '/pricing';
        }, 2000);
        return;
      }

      const { error } = await userService.exportUserDataAsCSV(user.id);

      if (error) {
        setError('Erro ao exportar dados: ' + error.message);
      } else {
        setSuccess('Dados exportados em CSV com sucesso! Verifique seus downloads.');
      }

      setExporting(false);
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
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
            
            {/* Profile Picture Section */}
            <div className="mb-8 flex flex-col items-center">
              <div className="relative">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.name}
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(profile.profile_picture_url || null);
                      setShowImageModal(true);
                    }}
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100 cursor-pointer hover:opacity-90 transition-opacity"
                    title="Clique para ver em tamanho maior"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-emerald-600 flex items-center justify-center border-4 border-emerald-100">
                    <span className="text-4xl font-bold text-white">
                      {profile ? getInitials(profile.name) : '?'}
                    </span>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfilePictureChange}
                className="hidden"
              />

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                >
                  {uploading ? 'Enviando...' : 'Alterar foto'}
                </button>
                {profile?.profile_picture_url && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeleteProfilePicture}
                      disabled={uploading}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG ou WEBP. Máximo 2MB.
              </p>
            </div>

            {/* Export Data Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                disabled={exporting}
                className="flex items-center gap-2 text-gray-700 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exportando...' : 'Exportar Meus Dados'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Baixe todos os seus dados em formato JSON ou CSV
              </p>
            </div>
            
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

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobre você (opcional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Ex: Treinador de futsal com 10 anos de experiência, certificado pela CBF..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/500 caracteres
                </p>
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
                Desativar Conta
              </h3>
              
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2 font-semibold">
                  ⚠️ Atenção: Sua conta será desativada!
                </p>
                <p className="text-sm text-red-800 mb-2">
                  Ao desativar sua conta:
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                  <li>Sua conta será desativada imediatamente</li>
                  <li>Você NÃO poderá fazer login</li>
                  <li>Para reativar, você deve entrar em contato com o suporte via WhatsApp</li>
                  <li>Após 365 dias inativa, todos os dados serão permanentemente removidos:</li>
                  <li className="ml-6">• Perfil e informações pessoais</li>
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
                  {saving ? 'Desativando...' : 'Desativar Minha Conta'}
                </button>
                
                <p className="mt-2 text-xs text-gray-600">
                  💡 Você terá 365 dias para reativar via suporte. Após isso, os dados serão deletados permanentemente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gerenciar Assinatura</h2>
            
            {/* Current Subscription Info */}
            {subscription && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {subscription.tier === 'premium' && <Crown className="w-6 h-6 text-yellow-500" />}
                      {subscription.tier === 'pro' && <Sparkles className="w-6 h-6 text-blue-500" />}
                      <h3 className="text-2xl font-bold text-gray-900">
                        Plano {TIER_INFO[subscription.tier].displayName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">{TIER_INFO[subscription.tier].description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{TIER_INFO[subscription.tier].price}</p>
                    {TIER_INFO[subscription.tier].priceMonthly > 0 && (
                      <p className="text-sm text-gray-600">/mês</p>
                    )}
                  </div>
                </div>

                {/* Trial Badge */}
                {subscription.status === 'trialing' && trialDaysLeft !== null && (
                  <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">
                      🎉 Teste grátis: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                    subscription.status === 'past_due' ? 'bg-red-100 text-red-800' :
                    subscription.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'active' ? '✓ Ativo' :
                     subscription.status === 'trialing' ? '🎁 Em teste' :
                     subscription.status === 'past_due' ? '⚠️ Pagamento pendente' :
                     subscription.status === 'canceled' ? '⏸️ Cancelado' :
                     subscription.status}
                  </span>
                </div>

                {/* AI Insights Usage (Pro tier) */}
                {subscription.tier === 'pro' && (
                  <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Insights de IA este mês</span>
                      <span className="text-sm font-bold text-gray-900">
                        {subscription.aiInsightsUsed} / {subscription.aiInsightsLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(subscription.aiInsightsUsed / subscription.aiInsightsLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Resource Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white bg-opacity-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Times</p>
                    <p className="text-lg font-bold text-gray-900">
                      {TIER_LIMITS[subscription.tier].teams === Infinity ? 'Ilimitados' : TIER_LIMITS[subscription.tier].teams}
                    </p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Atletas por time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {TIER_LIMITS[subscription.tier].playersPerTeam === Infinity ? 'Ilimitados' : TIER_LIMITS[subscription.tier].playersPerTeam}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Plans */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Planos Disponíveis</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className={`border-2 rounded-xl p-6 transition-all ${
                subscription?.tier === 'free' 
                  ? 'border-gray-400 bg-gray-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <h3 className="text-lg font-semibold mb-2">Gratuito</h3>
                <p className="text-3xl font-bold mb-4">R$ 0<span className="text-sm text-gray-600">/mês</span></p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> 1 time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> 15 atletas por time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Avaliações básicas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600">✗</span> Sem gráficos avançados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600">✗</span> Sem insights de IA
                  </li>
                </ul>
                {subscription?.tier === 'free' ? (
                  <div className="text-center text-sm font-medium text-gray-600 py-2">
                    Plano Atual
                  </div>
                ) : (
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                )}
              </div>

              {/* Pro Plan */}
              <div className={`border-2 rounded-xl p-6 transition-all ${
                subscription?.tier === 'pro'
                  ? 'border-blue-600 bg-blue-50 shadow-lg' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Pro</h3>
                  {!subscription || subscription.tier === 'free' ? (
                    <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded">POPULAR</span>
                  ) : null}
                </div>
                <p className="text-3xl font-bold mb-1">R$ 49<span className="text-sm text-gray-600">/mês</span></p>
                <p className="text-xs text-gray-600 mb-4">ou R$ 490/ano (economize 17%)</p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> 5 times
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Atletas ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Gráficos radar
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Gráficos de evolução
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> 5 insights IA/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Exportar PDF
                  </li>
                </ul>
                {subscription?.tier === 'pro' ? (
                  <div className="text-center text-sm font-medium text-blue-600 py-2">
                    ✓ Plano Atual
                  </div>
                ) : subscription?.tier === 'free' ? (
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Fazer Upgrade
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                )}
              </div>

              {/* Premium Plan */}
              <div className={`border-2 rounded-xl p-6 transition-all ${
                subscription?.tier === 'premium'
                  ? 'border-purple-600 bg-purple-50 shadow-lg' 
                  : 'border-purple-200 hover:border-purple-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Premium</h3>
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold mb-1">R$ 149<span className="text-sm text-gray-600">/mês</span></p>
                <p className="text-xs text-gray-600 mb-4">ou R$ 1.490/ano (economize 17%)</p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Times ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Atletas ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Insights IA ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Valências personalizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Portal para pais
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Múltiplos treinadores
                  </li>
                </ul>
                {subscription?.tier === 'premium' ? (
                  <div className="text-center text-sm font-medium text-purple-600 py-2">
                    ✓ Plano Atual
                  </div>
                ) : (
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium"
                  >
                    Fazer Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Start Trial Button (only for free users who haven't trialed) */}
            {subscription?.tier === 'free' && !subscription.trialEndsAt && (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Experimente o Plano Pro Grátis! 🎉
                    </h4>
                    <p className="text-sm text-gray-700 mb-4">
                      Teste todos os recursos profissionais por 14 dias, sem compromisso e sem cartão de crédito.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await subscriptionService.startTrial();
                          setSuccess('Teste iniciado com sucesso! Aproveite 14 dias grátis 🎉');
                          loadSubscription();
                        } catch (error: any) {
                          setError(error.message || 'Erro ao iniciar teste');
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Iniciar Teste Grátis de 14 Dias
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enterprise Contact */}
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Precisa de um plano Enterprise?
              </h4>
              <p className="text-sm text-gray-700 mb-4">
                Para clubes, academias e organizações que precisam de recursos avançados, API, white-label e suporte dedicado.
              </p>
              <a
                href={`https://wa.me/${import.meta.env.VITE_SUPPORT_WHATSAPP || '5511999999999'}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre o plano Enterprise do BaseCoach.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Falar com Vendas
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Export Format Selection Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Exportar Dados
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Format Selection */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Escolha o formato para exportar seus dados:
              </p>

              <div className="space-y-3">
                {/* CSV Option - Pro+ Feature */}
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                    exportFormat === 'csv'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${(!subscription || !TIER_FEATURES[subscription.tier].csvExport) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="mt-1"
                    disabled={!subscription || !TIER_FEATURES[subscription.tier].csvExport}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {subscription && TIER_FEATURES[subscription.tier].csvExport ? (
                        <FileText className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-semibold text-gray-900">CSV (Recomendado)</span>
                      {(!subscription || !TIER_FEATURES[subscription.tier].csvExport) && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-medium">Pro</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Múltiplos arquivos separados: perfil, times, atletas, sessões e avaliações.
                      Fácil de abrir no Excel ou Google Sheets.
                    </p>
                    {(!subscription || !TIER_FEATURES[subscription.tier].csvExport) && (
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        Upgrade para Pro para exportar em CSV
                      </p>
                    )}
                  </div>
                </label>

                {/* JSON Option */}
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    exportFormat === 'json'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">JSON</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Arquivo único com todos os dados em formato técnico.
                      Ideal para desenvolvedores ou backup completo.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={exporting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview/View Modal */}
      {showImageModal && imagePreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => selectedFile ? handleCancelUpload() : setShowImageModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedFile ? 'Confirmar Upload' : 'Visualizar Foto'}
              </h3>
              <button
                onClick={() => selectedFile ? handleCancelUpload() : setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-6 flex flex-col items-center">
              {selectedFile ? (
                <>
                  {/* Crop Area */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ width: '400px', height: '400px' }}>
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-move"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imageRef}
                        src={imagePreview || ''}
                        alt="Preview"
                        className="max-w-none"
                        style={{
                          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                          cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                        draggable={false}
                      />
                    </div>
                    
                    {/* Circular Crop Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg width="100%" height="100%" viewBox="0 0 400 400">
                        <defs>
                          <mask id="cropMask">
                            <rect width="400" height="400" fill="white" />
                            <circle cx="200" cy="200" r="150" fill="black" />
                          </mask>
                        </defs>
                        <rect width="400" height="400" fill="black" opacity="0.5" mask="url(#cropMask)" />
                        <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                      </svg>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Diminuir zoom"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-48"
                    />
                    
                    <button
                      type="button"
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-3 text-sm text-gray-600 text-center">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Arraste para posicionar • Use o zoom para ajustar
                    </p>
                  </div>

                  {/* Hidden canvas for cropping */}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-gray-500 p-8">
                  Imagem não encontrada
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedFile ? (
              <div className="flex gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={handleCancelUpload}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Enviando...' : 'Confirmar Upload'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

