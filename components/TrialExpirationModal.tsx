import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

interface TrialExpirationModalProps {
  isOpen: boolean;
  daysRemaining: number;
  onClose: () => void;
  onViewPricing: () => void;
}

export function TrialExpirationModal({ 
  isOpen, 
  daysRemaining, 
  onClose, 
  onViewPricing 
}: TrialExpirationModalProps) {
  if (!isOpen) return null;

  const isExpired = daysRemaining <= 0;
  const isLastDays = daysRemaining <= 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`${isExpired ? 'bg-red-600' : 'bg-yellow-500'} text-white p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isExpired ? 'Teste Encerrado' : `${daysRemaining} ${daysRemaining === 1 ? 'Dia' : 'Dias'} Restantes`}
              </h2>
              <p className="text-sm opacity-90">
                {isExpired ? 'Seu teste do plano Pro expirou' : 'Seu teste está quase no fim'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isExpired ? (
            <>
              <p className="text-slate-700 mb-4">
                Seu teste de 14 dias do plano Pro foi encerrado. Você foi movido de volta para o plano Free.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  O que você perdeu acesso:
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Gráficos avançados de desempenho</li>
                  <li>• Análise com IA</li>
                  <li>• Exportação em PDF e CSV</li>
                  <li>• Controle de presença</li>
                  <li>• Mais de 1 time e 15 atletas</li>
                </ul>
              </div>
              <p className="text-slate-700 mb-6">
                Gostou do que viu? Faça upgrade para o plano Pro e continue aproveitando todos os recursos!
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700 mb-4">
                Seu teste do plano Pro está chegando ao fim em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Não perca o acesso a:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ Gráficos avançados de desempenho</li>
                  <li>✓ 5 análises com IA por mês</li>
                  <li>✓ Exportação em PDF e CSV</li>
                  <li>✓ Controle de presença dos atletas</li>
                  <li>✓ Até 5 times com atletas ilimitados</li>
                </ul>
              </div>
              <p className="text-slate-700 mb-6">
                Faça upgrade agora e continue aproveitando todos os recursos Pro sem interrupções!
              </p>
            </>
          )}

          {/* Pricing Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-sm text-slate-600">A partir de</span>
              <span className="text-3xl font-bold text-slate-900">R$ 41,58</span>
              <span className="text-sm text-slate-600">/mês</span>
            </div>
            <p className="text-xs text-center text-slate-500">
              Plano anual (economize 17%)
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onViewPricing();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Ver Planos e Preços
              <ArrowRight className="w-5 h-5" />
            </button>
            {!isExpired && (
              <button
                onClick={onClose}
                className="w-full text-slate-600 hover:text-slate-900 py-2 transition-colors"
              >
                Continuar com Free
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

