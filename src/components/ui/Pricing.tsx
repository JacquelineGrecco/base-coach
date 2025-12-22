'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Zap, Award, Building2, MessageCircle } from 'lucide-react';
import { subscriptionService, SubscriptionInfo, TIER_INFO } from '@/features/auth/services/subscriptionService';
import { TrialModal } from '@/components/ui/TrialModal';

interface PricingProps {
  onStartTrial?: () => void;
  onUpgrade?: (tier: 'pro' | 'premium' | 'enterprise') => void;
}

export function Pricing({ onStartTrial, onUpgrade }: PricingProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    setLoading(true);
    const data = await subscriptionService.getUserSubscription();
    if (!data) {
      console.error('Error loading subscription');
    }
    setSubscription(data);
    setLoading(false);
  }

  const currentTier = subscription?.tier || 'free';
  const isOnTrial = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) > new Date() : false;

  // Pricing (in BRL)
  const pricing = {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 49.90, annual: 499.00 }, // ~R$41.58/month (saves 17%)
    premium: { monthly: 99.90, annual: 999.00 }, // ~R$83.25/month (saves 17%)
    enterprise: { monthly: 0, annual: 0 } // Custom pricing
  };

  const annualSavings = {
    pro: Math.round((1 - (pricing.pro.annual / 12) / pricing.pro.monthly) * 100),
    premium: Math.round((1 - (pricing.premium.annual / 12) / pricing.premium.monthly) * 100)
  };

  // Color classes for each tier
  const colorClasses = {
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: 'text-slate-600',
      button: 'bg-slate-600 hover:bg-slate-700'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    }
  };

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      icon: Zap,
      color: 'slate',
      description: 'Perfeito para começar',
      price: pricing.free,
      popular: false,
      cta: currentTier === 'free' ? 'Plano Atual' : 'Downgrade',
      features: [
        { text: '1 time', included: true },
        { text: 'Até 15 atletas', included: true },
        { text: 'Sessões de treino ilimitadas', included: true },
        { text: 'Relatórios básicos', included: true },
        { text: 'Exportar dados (JSON)', included: true },
        { text: 'Gráficos avançados', included: false },
        { text: 'Análise com IA', included: false },
        { text: 'Exportar PDF/CSV', included: false },
        { text: 'Controle de presença', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Award,
      color: 'blue',
      description: 'Para treinadores profissionais',
      price: pricing.pro,
      popular: true,
      cta: currentTier === 'pro' ? 'Plano Atual' : isOnTrial ? 'Em Teste Grátis' : 'Iniciar Teste Grátis',
      trialAvailable: !isOnTrial && currentTier === 'free',
      features: [
        { text: 'Até 5 times', included: true },
        { text: 'Atletas ilimitados', included: true },
        { text: 'Sessões de treino ilimitadas', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'Gráficos de radar e evolução', included: true },
        { text: '5 análises IA por mês', included: true },
        { text: 'Exportar PDF e CSV', included: true },
        { text: 'Controle de presença', included: true },
        { text: 'Suporte prioritário', included: true }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Award,
      color: 'purple',
      description: 'Para academias e clubes',
      price: pricing.premium,
      popular: false,
      cta: currentTier === 'premium' ? 'Plano Atual' : 'Fazer Upgrade',
      features: [
        { text: 'Times ilimitados', included: true },
        { text: 'Atletas ilimitados', included: true },
        { text: 'Sessões de treino ilimitadas', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'Gráficos de radar e evolução', included: true },
        { text: 'Análises IA ilimitadas', included: true },
        { text: 'Exportar PDF e CSV', included: true },
        { text: 'Controle de presença', included: true },
        { text: 'Suporte VIP (WhatsApp)', included: true },
        { text: 'Logo personalizada', included: true }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building2,
      color: 'emerald',
      description: 'Para organizações',
      price: pricing.enterprise,
      popular: false,
      cta: 'Falar com Vendas',
      features: [
        { text: 'Tudo do Premium, mais:', included: true },
        { text: 'Múltiplos treinadores', included: true },
        { text: 'API de integração', included: true },
        { text: 'White-label (marca própria)', included: true },
        { text: 'Treinamento personalizado', included: true },
        { text: 'SLA garantido', included: true },
        { text: 'Gerente de conta dedicado', included: true }
      ]
    }
  ];

  function getPrice(tier: typeof tiers[0]) {
    if (tier.id === 'free' || tier.id === 'enterprise') return null;
    const price = billingPeriod === 'monthly' ? tier.price.monthly : tier.price.annual / 12;
    return price.toFixed(2).replace('.', ',');
  }

  function handleCTAClick(tier: typeof tiers[0]) {
    if (tier.id === currentTier) return; // Already on this plan

    if (tier.id === 'enterprise') {
      // Contact sales via WhatsApp
      const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '5511999999999';
      const message = encodeURIComponent(
        `Olá! Gostaria de saber mais sobre o plano Enterprise do BaseCoach.`
      );
      window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, '_blank');
      return;
    }

    if (tier.id === 'pro' && tier.trialAvailable) {
      setShowTrialModal(true);
      return;
    }

    if (onUpgrade && (tier.id === 'pro' || tier.id === 'premium')) {
      onUpgrade(tier.id);
    }
  }

  function handleStartTrial() {
    setShowTrialModal(false);
    if (onStartTrial) {
      onStartTrial();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Trial Modal */}
      <TrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
      />

      {/* Header */}
      <div className="text-center pt-16 pb-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Escolha o Plano Ideal
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Comece grátis e faça upgrade quando precisar de mais recursos
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-md">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-full font-medium transition-all relative ${
              billingPeriod === 'annual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anual
            <span className="absolute -top-8 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Economize 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const colors = colorClasses[tier.color as keyof typeof colorClasses];
            const Icon = tier.icon;
            const isCurrentPlan = tier.id === currentTier;
            const isDisabled = isCurrentPlan || (tier.id === 'free' && currentTier !== 'free');

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                  tier.popular ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    Mais Popular
                  </div>
                )}

                {/* Header */}
                <div className={`${colors.bg} ${colors.border} border-b-2 p-6`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                    <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    {getPrice(tier) ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-slate-600">R$</span>
                          <span className="text-4xl font-bold text-slate-900">{getPrice(tier)}</span>
                          <span className="text-sm text-slate-600">/mês</span>
                        </div>
                        {billingPeriod === 'annual' && (
                          <p className="text-xs text-slate-500 mt-1">
                            Cobrado anualmente (R$ {tier.price.annual.toFixed(2).replace('.', ',')})
                          </p>
                        )}
                      </>
                    ) : tier.id === 'enterprise' ? (
                      <div className="text-2xl font-bold text-slate-900">Sob consulta</div>
                    ) : (
                      <div className="text-4xl font-bold text-slate-900">Grátis</div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleCTAClick(tier)}
                    disabled={isDisabled}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isDisabled
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : colors.button
                    }`}
                  >
                    {tier.cta}
                  </button>

                  {tier.trialAvailable && (
                    <p className="text-xs text-center text-slate-500 mt-2">
                      14 dias grátis • Sem cartão de crédito
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
          Perguntas Frequentes
        </h2>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Posso trocar de plano a qualquer momento?
            </h3>
            <p className="text-slate-600">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
              Ao fazer upgrade, você terá acesso imediato aos novos recursos. 
              Ao fazer downgrade, as mudanças entrarão em vigor no próximo ciclo de cobrança.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Como funciona o teste grátis?
            </h3>
            <p className="text-slate-600">
              O teste grátis do plano Pro dura 14 dias e não requer cartão de crédito. 
              Você terá acesso completo a todos os recursos do Pro. 
              Ao final do período, você pode escolher assinar ou continuar no plano Free.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Quais são as formas de pagamento?
            </h3>
            <p className="text-slate-600">
              Aceitamos pagamento via Pix, boleto bancário e cartão de crédito. 
              Para planos anuais, oferecemos desconto de 17% sobre o valor total.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              E se eu precisar de mais recursos?
            </h3>
            <p className="text-slate-600">
              Para organizações com necessidades específicas, oferecemos o plano Enterprise com 
              recursos personalizados, múltiplos treinadores, API de integração e muito mais. 
              Entre em contato conosco para saber mais!
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section (Placeholder) */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
          O Que Nossos Clientes Dizem
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Carlos Silva',
              role: 'Treinador de Futebol',
              avatar: 'CS',
              quote: 'O BaseCoach revolucionou a forma como gerencio meus atletas. Os relatórios são incríveis!'
            },
            {
              name: 'Ana Santos',
              role: 'Preparadora Física',
              avatar: 'AS',
              quote: 'A análise com IA me ajuda a identificar pontos de melhoria que antes passavam despercebidos.'
            },
            {
              name: 'Roberto Lima',
              role: 'Coordenador de Escolinha',
              avatar: 'RL',
              quote: 'Gerencio 5 times com facilidade. O controle de presença economiza muito tempo!'
            }
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-slate-600 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto Para Elevar Seu Treinamento?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Junte-se a centenas de treinadores que já confiam no BaseCoach
          </p>
          <button
            onClick={() => setShowTrialModal(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            Começar Teste Grátis de 14 Dias
          </button>
        </div>
      </div>
    </div>
  );
}
