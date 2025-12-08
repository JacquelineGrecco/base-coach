import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

interface LoginProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export function Login({ onSwitchToSignup, onForgotPassword }: LoginProps) {
  const { signIn, profileError, clearProfileError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);
  
  // WhatsApp support number (update this with your actual number)
  const SUPPORT_WHATSAPP = process.env.WHATSAPP_SUPPORT_NUMBER; // Format: Country code + number (no spaces/dashes)
  if (!SUPPORT_WHATSAPP) {
    throw new Error('WHATSAPP_SUPPORT_NUMBER is not set');
  }

  // Check for account lockout on mount
  React.useEffect(() => {
    const lockoutData = localStorage.getItem('login_lockout');
    if (lockoutData) {
      const { blockedUntil } = JSON.parse(lockoutData);
      const now = Date.now();
      if (blockedUntil > now) {
        setIsBlocked(true);
        setBlockCountdown(Math.ceil((blockedUntil - now) / 1000));
      } else {
        localStorage.removeItem('login_lockout');
      }
    }
  }, []);

  // Countdown timer for blocked account
  React.useEffect(() => {
    if (blockCountdown > 0) {
      const timer = setTimeout(() => {
        setBlockCountdown(blockCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (blockCountdown === 0 && isBlocked) {
      setIsBlocked(false);
      localStorage.removeItem('login_lockout');
    }
  }, [blockCountdown, isBlocked]);

  // Handle WhatsApp support contact
  function handleContactSupport() {
    const message = encodeURIComponent(
      `Olá! Minha conta do BaseCoach foi desativada e gostaria de reativá-la.\n\nEmail: ${email}`
    );
    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    clearProfileError(); // Clear any previous profile errors
    setIsAccountDeactivated(false);
    
    // Check if account is blocked
    if (isBlocked) {
      setError(`Conta temporariamente bloqueada. Aguarde ${blockCountdown} segundos.`);
      return;
    }

    // Validate required fields in Portuguese
    if (!email.trim()) {
      setError('Por favor, preencha seu email');
      return;
    }

    if (!password) {
      setError('Por favor, preencha sua senha');
      return;
    }

    setLoading(true);

    try {
      // First, try to sign in to get the user ID
      const { error } = await signIn(email, password);
      
      if (error) {
        // Track failed attempts
        const attemptsKey = `login_attempts_${email}`;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
        localStorage.setItem(attemptsKey, attempts.toString());

        // Block after 3 failed attempts
        if (attempts >= 3) {
          const blockedUntil = Date.now() + 60000; // 60 seconds
          localStorage.setItem('login_lockout', JSON.stringify({ blockedUntil, email }));
          localStorage.removeItem(attemptsKey);
          setIsBlocked(true);
          setBlockCountdown(60);
          setError('Muitas tentativas incorretas. Conta bloqueada por 60 segundos.');
          setLoading(false);
          return;
        }

        const remainingAttempts = 3 - attempts;

        // Translate Supabase errors to user-friendly Portuguese messages
        if (error.message.includes('Invalid login credentials')) {
          setError(`Email ou senha incorretos. ${remainingAttempts} tentativas restantes.`);
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.');
          localStorage.removeItem(attemptsKey); // Don't count this as failed attempt
        } else if (error.message.includes('User not found')) {
          setError('Usuário não encontrado. Você já possui uma conta?');
          setIsAccountDeactivated(true);
        } else {
          // Fallback for other errors
          setError('Erro ao fazer login. Tente novamente ou entre em contato com o suporte.');
        }
      } else {
        // Successful login - clear attempts
        const attemptsKey = `login_attempts_${email}`;
        localStorage.removeItem(attemptsKey);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
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
            <LogIn className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BaseCoach</h1>
          <p className="text-gray-600">Faça login na sua conta</p>
        </div>

        {/* Error Messages */}
        {(error || profileError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {profileError && (
                <div className="mb-2">
                  <p className="text-sm text-red-600 font-semibold">Conta Desativada</p>
                  <p className="text-sm text-red-600">{profileError}</p>
                  <button
                    onClick={handleContactSupport}
                    className="mt-2 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium underline"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Falar com Suporte via WhatsApp
                  </button>
                </div>
              )}
              {error && !profileError && (
                <>
                  <p className="text-sm text-red-600">{error}</p>
                  {isAccountDeactivated && (
                    <button
                      onClick={handleContactSupport}
                      className="mt-2 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium underline"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Falar com Suporte via WhatsApp
                    </button>
                  )}
                  {isBlocked && blockCountdown > 0 && (
                    <p className="mt-2 text-sm text-red-700 font-semibold">
                      ⏱️ Aguarde {blockCountdown} segundos para tentar novamente
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Manter-me conectado
              </label>
            </div>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Switch to Signup */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-emerald-600 font-medium hover:text-emerald-700"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

