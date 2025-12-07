import React, { useState, useMemo } from 'react';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignupProps {
  onSwitchToLogin: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const { signUp, clearProfileError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState(''); // Store email for success message
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(40);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear profile error when component mounts
  React.useEffect(() => {
    clearProfileError();
  }, [clearProfileError]);

  // Auto-redirect countdown after successful signup
  React.useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      onSwitchToLogin();
    }
  }, [success, countdown, onSwitchToLogin]);

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
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

    // Validate required fields in Portuguese
    if (!name.trim()) {
      setError('Por favor, preencha seu nome');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, preencha seu email');
      return;
    }

    if (!password) {
      setError('Por favor, crie uma senha');
      return;
    }

    if (!confirmPassword) {
      setError('Por favor, confirme sua senha');
      return;
    }

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
      const { error } = await signUp(email, password, name);
      if (error) {
        // Translate Supabase errors to user-friendly Portuguese messages
        if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          setError('Este email já foi usado anteriormente. Se você deletou sua conta, entre em contato com o suporte para reativar ou use outro email.');
        } else if (error.message.includes('Invalid email')) {
          setError('Email inválido. Verifique o formato do email.');
        } else if (error.message.includes('Password should be at least')) {
          setError('A senha deve ter pelo menos 6 caracteres.');
        } else {
          // Fallback for other errors
          console.error('Signup error:', error);
          setError('Erro ao criar conta. Tente novamente ou entre em contato com o suporte.');
        }
      } else {
        setSuccess(true);
        setSuccessEmail(email); // Save email before clearing form
        setCountdown(40); // Reset countdown
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Signup exception:', err);
      setError('Erro ao criar conta. Tente novamente.');
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
            <UserPlus className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BaseCoach</h1>
          <p className="text-gray-600">Crie sua conta de treinador</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-600 font-semibold">Conta criada com sucesso!</p>
                <p className="text-sm text-green-600 mt-1">
                  📧 Enviamos um email de confirmação para <strong>{successEmail}</strong>
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded border border-green-200">
              <p className="text-xs text-gray-700 font-medium mb-1">Próximos passos:</p>
              <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                <li>Abra seu email e procure por "BaseCoach"</li>
                <li>Clique no link de confirmação</li>
                <li>Volte aqui e faça login para acessar sua conta</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2">
                💡 Não recebeu o email? Verifique a pasta de spam.
              </p>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 flex items-center justify-between">
              <p className="text-xs text-blue-800">
                🔄 Redirecionando para o login em <strong>{countdown} segundos</strong>
              </p>
              <button
                onClick={onSwitchToLogin}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Ir agora
              </button>
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
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
                placeholder="Mínimo 8 caracteres"
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
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-emerald-600 font-medium hover:text-emerald-700"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

