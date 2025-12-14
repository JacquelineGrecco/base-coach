import React from 'react';
import { X, Check, Sparkles, Clock, CreditCard } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  loading?: boolean;
}

export function TrialModal({ isOpen, onClose, onStartTrial, loading = false }: TrialModalProps) {
  if (!isOpen) return null;

  const proBenefits = [
    { icon: '📊', text: 'Gráficos de radar e evolução', description: 'Visualize o progresso dos atletas' },
    { icon: '🤖', text: '5 análises com IA por mês', description: 'Insights personalizados sobre cada atleta' },
    { icon: '📄', text: 'Exportar PDF e CSV', description: 'Relatórios profissionais para compartilhar' },
    { icon: '✅', text: 'Controle de presença', description: 'Acompanhe a frequência dos atletas' },
    { icon: '👥', text: 'Até 5 times', description: 'Gerencie múltiplos grupos' },
    { icon: '∞', text: 'Atletas ilimitados', description: 'Sem limite de jogadores por time' },
    { icon: '🎯', text: 'Relatórios avançados', description: 'Análises detalhadas de desempenho' },
    { icon: '💬', text: 'Suporte prioritário', description: 'Respostas mais rápidas via WhatsApp' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Teste Grátis do Pro</h2>
              <p className="text-blue-100 text-sm">Desbloqueie todo o potencial do BaseCoach</p>
            </div>
          </div>

          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-white/30 mt-4">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-lg">14 dias grátis</span>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-blue-100">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Sem cartão de crédito • Cancele quando quiser</span>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            O que você ganha com o plano Pro:
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {proBenefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="text-2xl flex-shrink-0">{benefit.icon}</div>
                <div>
                  <div className="font-semibold text-slate-900">{benefit.text}</div>
                  <div className="text-sm text-slate-600">{benefit.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">?</span>
              Como funciona?
            </h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <span className="text-slate-900 font-medium">Ative seu teste grátis agora</span>
                  <p className="text-sm text-slate-600">Sem precisar cadastrar cartão de crédito</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <span className="text-slate-900 font-medium">Use todos os recursos Pro por 14 dias</span>
                  <p className="text-sm text-slate-600">Teste gráficos, IA, exportação e muito mais</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <span className="text-slate-900 font-medium">Decida se quer continuar</span>
                  <p className="text-sm text-slate-600">Ao final, escolha assinar ou volte ao plano Free</p>
                </div>
              </li>
            </ol>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onStartTrial}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Ativando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Começar Teste Grátis</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agora Não
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-slate-500 text-center mt-6">
            Ao iniciar o teste grátis, você concorda com nossos <a href="#" className="underline hover:text-slate-700">Termos de Uso</a>.
            Você pode cancelar a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
