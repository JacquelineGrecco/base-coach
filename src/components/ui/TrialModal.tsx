'use client';

import React from 'react';
import { X, Zap, Check, Sparkles } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

export function TrialModal({ isOpen, onClose, onStartTrial }: TrialModalProps) {
  if (!isOpen) return null;

  const proFeatures = [
    'Até 5 times com atletas ilimitados',
    'Gráficos de radar e evolução',
    '5 análises com IA por mês',
    'Exportar relatórios em PDF e CSV',
    'Controle de presença dos atletas',
    'Suporte prioritário via WhatsApp'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Teste Grátis Pro</h2>
              <p className="text-blue-100 text-sm">Desbloqueie todo o potencial</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 14 Days Badge */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-1">14 Dias</div>
            <div className="text-emerald-700 font-medium">Totalmente Grátis</div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-600 font-medium">
                Sem cartão de crédito
              </span>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              O que você vai ganhar:
            </h3>
            <ul className="space-y-3">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onStartTrial();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Iniciar Teste Grátis
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-600 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Agora Não
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-slate-500 text-center mt-4">
            Ao final do período de teste, você pode escolher assinar ou continuar no plano Free.
            Não há renovação automática.
          </p>
        </div>
      </div>
    </div>
  );
}
