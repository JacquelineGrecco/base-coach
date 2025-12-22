'use client';

import React, { useState } from 'react';
import { Lock, Sparkles, TrendingUp, Crown, ArrowRight } from 'lucide-react';
import { SubscriptionTier, TIER_INFO } from '@/features/auth/services/subscriptionService';
import { TrialModal } from './TrialModal';
import { subscriptionService } from '@/features/auth/services/subscriptionService';
import { useAuth } from '@/features/auth/context/AuthContext';

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredTier: Exclude<SubscriptionTier, 'free'>;
  ctaText?: string;
  size?: 'small' | 'medium' | 'large';
  showPreview?: boolean;
  previewElement?: React.ReactNode;
  onUpgradeClick?: () => void;
}

const TIER_ICONS = {
  pro: Sparkles,
  premium: TrendingUp,
  enterprise: Crown,
};

const TIER_COLORS = {
  pro: {
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  },
  premium: {
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
    badge: 'bg-purple-100 text-purple-800',
  },
  enterprise: {
    bg: 'from-gray-50 to-slate-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
    icon: 'text-gray-600',
    button: 'bg-gray-900 hover:bg-gray-800',
    badge: 'bg-gray-100 text-gray-800',
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  description,
  requiredTier,
  ctaText,
  size = 'medium',
  showPreview = false,
  previewElement,
  onUpgradeClick,
}) => {
  const { user } = useAuth();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  
  const tierInfo = TIER_INFO[requiredTier];
  const colors = TIER_COLORS[requiredTier];
  const Icon = TIER_ICONS[requiredTier];

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const iconSizes = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const iconInnerSizes = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  async function handleStartTrial() {
    if (!user?.id) return;
    
    setStartingTrial(true);
    try {
      await subscriptionService.startTrial();
      alert('🎉 Teste Pro iniciado com sucesso! Você tem 14 dias para explorar todos os recursos.');
      window.location.reload(); // Reload to update UI
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setStartingTrial(false);
      setShowTrialModal(false);
    }
  }

  function handleUpgradeClick() {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (requiredTier === 'pro') {
      setShowTrialModal(true);
    } else {
      window.location.href = '/pricing';
    }
  }

  return (
    <>
      <div className={`bg-gradient-to-br ${colors.bg} rounded-xl border-2 ${colors.border} ${sizeClasses[size]} text-center relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Preview with Blur (if provided) */}
          {showPreview && previewElement && (
            <div className="relative mb-6 -mx-6 -mt-6">
              <div className="filter blur-xl opacity-50 pointer-events-none">
                {previewElement}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
                  <Lock className={`${iconInnerSizes[size]} text-gray-600`} />
                </div>
              </div>
            </div>
          )}

          {/* Lock Icon */}
          {!showPreview && (
            <div className={`inline-flex items-center justify-center ${iconSizes[size]} rounded-full bg-white shadow-md mb-4`}>
              <Lock className={`${iconInnerSizes[size]} text-gray-400`} />
            </div>
          )}
          
          {/* Feature Name */}
          <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
            {feature}
          </h3>
          
          {/* Description */}
          <p className="text-gray-700 mb-4 max-w-md mx-auto">
            {description}
          </p>

          {/* Tier Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 mb-4 shadow-sm">
            <Icon className={`w-5 h-5 ${colors.icon}`} />
            <span className="text-sm font-medium text-gray-700">
              Disponível no plano <strong className={colors.text}>{tierInfo.displayName}</strong>
            </span>
          </div>

          {/* Pricing Info */}
          {(tierInfo.priceMonthly || 0) > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              A partir de <span className="font-bold text-gray-900">{tierInfo.price}/mês</span>
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleUpgradeClick}
              className={`px-6 py-3 ${colors.button} text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg`}
            >
              {requiredTier === 'pro' ? 'Iniciar Teste Grátis' : ctaText || `Fazer Upgrade para ${tierInfo.displayName}`}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 transition-colors font-medium"
            >
              Ver Todos os Planos
            </button>
          </div>

          {/* Additional Info */}
          {requiredTier === 'pro' && (
            <p className="text-xs text-gray-600 mt-4">
              🎁 Teste grátis por 14 dias • Sem cartão de crédito
            </p>
          )}
        </div>
      </div>

      {/* Trial Modal */}
      <TrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
      />
    </>
  );
};

// Compact version for inline use
export const UpgradePromptInline: React.FC<Pick<UpgradePromptProps, 'feature' | 'requiredTier'>> = ({
  feature,
  requiredTier,
}) => {
  const tierInfo = TIER_INFO[requiredTier];
  const colors = TIER_COLORS[requiredTier];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 ${colors.badge} rounded-lg text-sm font-medium`}>
      <Lock className="w-4 h-4" />
      <span>{feature} - {tierInfo.displayName}</span>
      <button
        onClick={() => window.location.href = '/pricing'}
        className="ml-2 text-xs underline hover:no-underline"
      >
        Upgrade
      </button>
    </div>
  );
};

// Badge version for feature labels
export const UpgradeBadge: React.FC<{ tier: Exclude<SubscriptionTier, 'free'> }> = ({ tier }) => {
  const tierInfo = TIER_INFO[tier];
  const colors = TIER_COLORS[tier];
  const Icon = TIER_ICONS[tier];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 ${colors.badge} rounded text-xs font-medium`}>
      <Icon className="w-3 h-3" />
      {tierInfo.displayName}
    </span>
  );
};

