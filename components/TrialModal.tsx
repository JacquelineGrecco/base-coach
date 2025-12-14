import React from 'react';
import { X, Zap, Check, Gift } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

export function TrialModal({ isOpen, onClose, onStartTrial }: TrialModalProps) {
  if (!isOpen) return null;

  const trialFeatures = [
    'Até 5 times com atletas ilimitados',
    'Gráficos de radar e evolução',
    '5 análises com IA por mês',
    'Exportar relatórios em PDF e CSV',
    'Controle de presença dos atletas',
    'Suporte prioritário via WhatsApp'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-3 rounded-full">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Teste o Plano Pro</h2>
              <p className="text-blue-100 text-sm">14 dias grátis</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* No Credit Card Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 flex items-center gap-3">
            <div className="bg-emerald-500 text-white rounded-full p-2">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Sem cartão de crédito</p>
              <p className="text-sm text-emerald-700">Cancele a qualquer momento</p>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">
              O que você vai experimentar:
            </h3>
            <ul className="space-y-2">
              {trialFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Hoje</span>
              <span className="text-sm font-medium text-slate-600">Dia 14</span>
            </div>
            <div className="relative">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Você será notificado antes do fim do período de teste
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onStartTrial();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Começar Teste Grátis Agora
            </button>
            <button
              onClick={onClose}
              className="w-full text-slate-600 hover:text-slate-900 py-2 transition-colors"
            >
              Talvez mais tarde
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-slate-400 text-center mt-4">
            Após o período de teste, você pode escolher assinar o plano Pro ou continuar no plano Free.
            Não há cobrança automática.
          </p>
        </div>
      </div>
    </div>
  );
}
