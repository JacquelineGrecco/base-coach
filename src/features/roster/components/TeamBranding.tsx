'use client';

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Trash2, 
  Palette, 
  Check, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { teamService, Team } from '@/features/roster/services/teamService';

interface TeamBrandingProps {
  team: Team;
  onUpdate: () => void;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  '#16a34a', // Green
  '#2563eb', // Blue
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#4b5563', // Gray
  '#000000', // Black
  '#facc15', // Yellow
];

const TeamBranding: React.FC<TeamBrandingProps> = ({ team, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [primaryColor, setPrimaryColor] = useState(team.primary_color || '#16a34a');
  const [secondaryColor, setSecondaryColor] = useState(team.secondary_color || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'secondary' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB');
      return;
    }

    setError('');
    setUploading(true);

    const { url, error } = await teamService.uploadTeamLogo(team.id, file);

    if (error) {
      setError('Erro ao fazer upload: ' + error.message);
    } else {
      setSuccess('Logo atualizado com sucesso!');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDeleteLogo() {
    if (!team.logo_url) return;
    if (!confirm('Tem certeza que deseja remover o logo?')) return;

    setUploading(true);
    setError('');

    const { error } = await teamService.deleteTeamLogo(team.id, team.logo_url);

    if (error) {
      setError('Erro ao remover logo: ' + error.message);
    } else {
      setSuccess('Logo removido com sucesso!');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    }

    setUploading(false);
  }

  async function handleSaveColors() {
    setSaving(true);
    setError('');

    const { error } = await teamService.updateTeamBranding(team.id, {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });

    if (error) {
      setError('Erro ao salvar cores: ' + error.message);
    } else {
      setSuccess('Cores salvas com sucesso!');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    }

    setSaving(false);
  }

  const hasColorChanges = primaryColor !== (team.primary_color || '#16a34a') || 
                          secondaryColor !== (team.secondary_color || '#ffffff');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          Identidade Visual
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Personalize o logo e as cores do time para os relatórios em PDF
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 md:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-4 md:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6">
        {/* Logo Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Logo do Time
          </label>
          
          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="relative">
              {team.logo_url ? (
                <div className="relative group">
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200"
                  />
                  <button
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    title="Remover logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {uploading ? 'Enviando...' : team.logo_url ? 'Alterar Logo' : 'Adicionar Logo'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                JPG, PNG ou WEBP. Máximo 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Cores do Time
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Color */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Cor Principal
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')}
                  className="w-full flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="font-mono text-sm text-slate-700">{primaryColor.toUpperCase()}</span>
                </button>

                {/* Color Picker Dropdown */}
                {showColorPicker === 'primary' && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setPrimaryColor(color);
                            setShowColorPicker(null);
                          }}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            primaryColor === color 
                              ? 'border-slate-900 scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Cor Secundária
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')}
                  className="w-full flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span className="font-mono text-sm text-slate-700">{secondaryColor.toUpperCase()}</span>
                </button>

                {/* Color Picker Dropdown */}
                {showColorPicker === 'secondary' && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', ...PRESET_COLORS.slice(0, 5)].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setSecondaryColor(color);
                            setShowColorPicker(null);
                          }}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            secondaryColor === color 
                              ? 'border-slate-900 scale-110' 
                              : 'border-slate-200 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-xl border-2 border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Prévia</p>
            <div 
              className="h-16 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                borderBottom: `4px solid ${secondaryColor === '#ffffff' ? primaryColor : secondaryColor}`
              }}
            >
              {team.logo_url && (
                <img src={team.logo_url} alt="" className="w-10 h-10 rounded-lg mr-3 bg-white/20 p-1" />
              )}
              {team.name}
            </div>
          </div>

          {/* Save Button */}
          {hasColorChanges && (
            <button
              onClick={handleSaveColors}
              disabled={saving}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Cores'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamBranding;

