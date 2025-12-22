'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Clock, Zap, CreditCard } from 'lucide-react';
import { subscriptionService, SubscriptionInfo } from '@/features/auth/services/subscriptionService';

interface TrialExpirationWarningProps {
  subscription: SubscriptionInfo | null;
  onUpgrade: () => void;
}

export function TrialExpirationWarning({ subscription, onUpgrade }: TrialExpirationWarningProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalShown, setModalShown] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!subscription?.trialEndsAt) return;

    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Show modal at specific milestones: 7 days, 3 days, and 0 days (expired)
    const shouldShow = 
      (daysLeft === 7 && !modalShown['7days']) ||
      (daysLeft === 3 && !modalShown['3days']) ||
      (daysLeft === 0 && !modalShown['expired']);

    if (shouldShow) {
      setShowModal(true);
      
      // Mark this milestone as shown
      const key = daysLeft === 7 ? '7days' : daysLeft === 3 ? '3days' : 'expired';
      setModalShown(prev => ({ ...prev, [key]: true }));
    }
  }, [subscription, modalShown]);

  if (!subscription?.trialEndsAt || !showModal) return null;

  const now = new Date();
  const trialEnd = new Date(subscription.trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  const getMessage = () => {
    if (isExpired) {
      return {
        title: 'Seu Teste Pro Expirou',
        description: 'Seu período de teste de 14 dias chegou ao fim. Continue aproveitando todos os recursos Pro assinando agora!',
        icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        ctaText: 'Assinar Plano Pro',
        ctaColor: 'bg-red-600 hover:bg-red-700'
      };
    } else if (daysLeft <= 3) {
      return {
        title: 'Seu Teste Está Acabando! ⚠️',
        description: `Faltam apenas ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} para o fim do seu teste grátis. Não perca acesso aos recursos Pro!`,
        icon: <Clock className="w-16 h-16 text-orange-500" />,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        ctaText: 'Assinar Agora',
        ctaColor: 'bg-orange-600 hover:bg-orange-700'
      };
    } else {
      return {
        title: 'Sua Última Semana de Teste 🎁',
        description: `Você tem ${daysLeft} dias restantes do teste Pro. Aproveite ao máximo os recursos avançados!`,
        icon: <Zap className="w-16 h-16 text-blue-500" />,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        ctaText: 'Ver Planos',
        ctaColor: 'bg-blue-600 hover:bg-blue-700'
      };
    }
  };

  const message = getMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`${message.bgColor} border-b-2 ${message.borderColor} p-6 relative`}>
          {!isExpired && (
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              {message.icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{message.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 text-center mb-6">
            {message.description}
          </p>

          {/* Benefits Reminder (if not expired) */}
          {!isExpired && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Recursos que você vai perder:
              </h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Gráficos de radar e evolução</li>
                <li>• Análises com IA</li>
                <li>• Exportar PDF e CSV</li>
                <li>• Controle de presença</li>
                <li>• Até 5 times com atletas ilimitados</li>
              </ul>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowModal(false);
                onUpgrade();
              }}
              className={`w-full ${message.ctaColor} text-white py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
            >
              <CreditCard className="w-5 h-5" />
              {message.ctaText}
            </button>
            
            {!isExpired && (
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-100 text-slate-600 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Lembrar Depois
              </button>
            )}
          </div>

          {/* Pricing Info */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Plano Pro a partir de <span className="font-bold text-slate-700">R$ 41,58/mês</span>
              <br />
              <span className="text-xs">(plano anual - economize 17%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}





