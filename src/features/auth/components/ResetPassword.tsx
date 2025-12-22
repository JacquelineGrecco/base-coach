'use client';

import React, { useState, useMemo } from 'react';
import { Lock, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';

interface ResetPasswordProps {
  onSuccess: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    if (score < 40) return { score, label: 'Fraca', color: 'bg-red-500' };
    if (score < 60) return { score, label: 'Média', color: 'bg-yellow-500' };
    if (score < 80) return { score, label: 'Boa', color: 'bg-blue-500' };
    return { score, label: 'Forte', color: 'bg-green-500' };
  }, [password]);

  // Validation requirements
  const requirements = useMemo(() => [
    { test: password.length >= 8, label: 'Pelo menos 8 caracteres' },
    { test: /[a-z]/.test(password), label: 'Uma letra minúscula' },
    { test: /[A-Z]/.test(password), label: 'Uma letra maiúscula' },
    { test: /[0-9]/.test(password), label: 'Um número' },
    { test: /[^a-zA-Z0-9]/.test(password), label: 'Um caractere especial (!@#$...)' },
  ], [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    // Check if all requirements are met
    const allRequirementsMet = requirements.every(req => req.test);
    if (!allRequirementsMet) {
      setError('A senha não atende aos requisitos de segurança');
      return;
    }

    // Check password strength
    if (passwordStrength.score < 60) {
      setError('A senha é muito fraca. Use uma combinação de letras, números e caracteres especiais');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.updatePassword(password);
      if (error) {
        // Translate Supabase errors to Portuguese
        if (error.message.includes('New password should be different')) {
          setError('A nova senha deve ser diferente da senha antiga');
        } else if (error.message.includes('Password should be at least')) {
          setError('A senha deve ter pelo menos 8 caracteres');
        } else {
          setError('Erro ao redefinir senha. Tente novamente.');
        }
      } else {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Redefinir senha</h1>
          <p className="text-gray-600">Digite sua nova senha</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-600 font-medium">Senha alterada com sucesso!</p>
              <p className="text-xs text-green-600 mt-1">
                Redirecionando para o login...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Força da senha:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score < 40 ? 'text-red-600' :
                    passwordStrength.score < 60 ? 'text-yellow-600' :
                    passwordStrength.score < 80 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Password Requirements */}
          {password && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-gray-700 mb-2">Requisitos da senha:</p>
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  {req.test ? (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${req.test ? 'text-green-600' : 'text-gray-600'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Alterando senha...' : success ? 'Senha alterada!' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

