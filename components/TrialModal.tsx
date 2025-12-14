import React from 'react';
import { X, Zap, Check, Gift } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

export function TrialModal({ isOpen, onClose, onStartTrial }: TrialModalProps) {
  if (!isOpen) return null;

  const proBenefits = [
    'Até 5 times',
    'Atletas ilimitados',
    'Gráficos de radar e evolução',
    '5 análises com IA por mês',
    'Exportar PDF e CSV',
    'Controle de presença',
    'Relatórios avançados',
    'Suporte prioritário'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Teste o Pro Grátis!</h2>
              <p className="text-blue-100 text-lg">14 dias de acesso completo</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold text-lg">Sem compromisso</span>
            </div>
            <ul className="space-y-1 text-sm text-blue-100">
              <li>✓ Sem cartão de crédito</li>
              <li>✓ Cancele a qualquer momento</li>
              <li>✓ Acesso imediato a todos os recursos</li>
            </ul>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            O que você ganha com o Pro:
          </h3>
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {proBenefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Pricing Preview */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 mb-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Após o teste grátis:</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">R$ 49,90</div>
                <div className="text-sm text-slate-500">por mês</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              Você será notificado 7 dias antes do fim do período de teste
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={onStartTrial}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              🎉 Iniciar Teste Grátis Agora
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 text-slate-600 hover:text-slate-800 transition-colors font-medium"
            >
              Talvez mais tarde
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                Dados seguros
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                Cancele quando quiser
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                Suporte prioritário
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

