'use client';

import React from 'react';
import { X, Lock, Crown, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { SubscriptionTier, TIER_INFO } from '@/features/auth/services/subscriptionService';

interface UpgradeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'teams' | 'players';
  currentTier: SubscriptionTier;
  currentCount: number;
  limit: number;
  onUpgrade: () => void;
}

export function UpgradeLimitModal({
  isOpen,
  onClose,
  limitType,
  currentTier,
  currentCount,
  limit,
  onUpgrade
}: UpgradeLimitModalProps) {
  if (!isOpen) return null;

  const isTeamLimit = limitType === 'teams';
  const nextTier: SubscriptionTier = currentTier === 'free' ? 'pro' : currentTier === 'pro' ? 'premium' : 'enterprise';
  const nextTierInfo = TIER_INFO[nextTier];

  const upgradeOptions = [
    {
      tier: 'pro' as SubscriptionTier,
      icon: Sparkles,
      color: 'blue',
      benefits: isTeamLimit
        ? ['Até 5 times', 'Atletas ilimitados', 'Gráficos avançados', 'Análise com IA', 'PDF/CSV Export']
        : ['Atletas ilimitados', 'Até 5 times', 'Gráficos avançados', 'Análise com IA', 'PDF/CSV Export'],
      recommended: currentTier === 'free'
    },
    {
      tier: 'premium' as SubscriptionTier,
      icon: TrendingUp,
      color: 'purple',
      benefits: isTeamLimit
        ? ['Times ilimitados', 'Atletas ilimitados', 'IA ilimitada', 'Suporte VIP', 'Logo personalizada']
        : ['Atletas ilimitados', 'Times ilimitados', 'IA ilimitada', 'Suporte VIP', 'Logo personalizada'],
      recommended: currentTier === 'pro'
    },
    {
      tier: 'enterprise' as SubscriptionTier,
      icon: Crown,
      color: 'gray',
      benefits: ['Tudo do Premium', 'Múltiplos treinadores', 'API', 'White-label', 'SLA garantido'],
      recommended: false
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'from-blue-600 to-indigo-600',
      border: 'border-blue-500',
      badge: 'bg-blue-100 text-blue-700'
    },
    purple: {
      bg: 'from-purple-600 to-pink-600',
      border: 'border-purple-500',
      badge: 'bg-purple-100 text-purple-700'
    },
    gray: {
      bg: 'from-gray-700 to-gray-900',
      border: 'border-gray-600',
      badge: 'bg-gray-100 text-gray-700'
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Limite Atingido</h2>
              <p className="text-red-100 text-sm">Faça upgrade para continuar</p>
            </div>
          </div>

          {/* Current Limit Info */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4 border border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isTeamLimit ? 'Times' : 'Atletas'} no plano {TIER_INFO[currentTier].displayName}:
              </span>
              <span className="text-2xl font-bold">
                {currentCount}/{limit}
              </span>
            </div>
            <p className="text-xs text-red-100 mt-2">
              Você precisa fazer upgrade para criar mais {isTeamLimit ? 'times' : 'atletas'}.
            </p>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Escolha o Plano Ideal Para Você
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {upgradeOptions.map((option) => {
              const Icon = option.icon;
              const colors = colorClasses[option.color as keyof typeof colorClasses];
              const tierInfo = TIER_INFO[option.tier];

              return (
                <div
                  key={option.tier}
                  className={`relative bg-white rounded-xl border-2 ${option.recommended ? colors.border : 'border-gray-200'} p-6 transition-all hover:shadow-lg ${option.recommended ? 'shadow-lg scale-105' : ''}`}
                >
                  {option.recommended && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${colors.bg} text-white text-xs font-bold px-4 py-1 rounded-full`}>
                      Recomendado
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-6 h-6 text-gray-600" />
                    <h4 className="text-xl font-bold text-slate-900">{tierInfo.displayName}</h4>
                  </div>

                  <div className="text-3xl font-bold text-slate-900 mb-4">
                    {(tierInfo.priceMonthly || 0) > 0 ? (
                      <>
                        R$ {tierInfo.priceMonthly?.toFixed(2).replace('.', ',')}
                        <span className="text-sm text-gray-600 font-normal">/mês</span>
                      </>
                    ) : (
                      <span className="text-lg">Sob consulta</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {option.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      onClose();
                      onUpgrade();
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      option.recommended
                        ? `bg-gradient-to-r ${colors.bg} text-white hover:opacity-90`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } flex items-center justify-center gap-2`}
                  >
                    {option.tier === 'pro' && currentTier === 'free' ? 'Iniciar Teste Grátis' : 'Escolher Plano'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {option.tier === 'pro' && currentTier === 'free' && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      14 dias grátis • Sem cartão
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Não tem certeza qual plano escolher?
            </p>
            <button
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              Ver Comparação Completa de Planos →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

