'use client';

import React, { useState } from 'react';
import { Mail, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface EmailVerificationRequiredProps {
  email: string;
}

export function EmailVerificationRequired({ email }: EmailVerificationRequiredProps) {
  const { signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  async function handleResendEmail() {
    setResending(true);
    setError('');
    setResent(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirme seu Email</h1>
          <p className="text-gray-600">
            Você precisa verificar seu email antes de acessar o BaseCoach
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            📧 Enviamos um email de confirmação para:
          </p>
          <p className="text-sm font-semibold text-blue-900 break-all">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">O que fazer:</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Abra seu email</li>
            <li>Procure por "BaseCoach" ou "Confirme seu email"</li>
            <li>Clique no link de confirmação</li>
            <li>Volte aqui e faça login</li>
          </ol>
        </div>

        {/* Success/Error Messages */}
        {resent && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">Email reenviado com sucesso!</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
          </button>

          {/* Logout Button */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>Não recebeu o email?</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Verifique a pasta de spam/lixo eletrônico</li>
            <li>Aguarde alguns minutos (pode demorar)</li>
            <li>Clique em "Reenviar Email" acima</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

