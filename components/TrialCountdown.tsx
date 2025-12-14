import React from 'react';
import { Gift, AlertCircle } from 'lucide-react';

interface TrialCountdownProps {
  daysRemaining: number;
  onUpgradeClick: () => void;
}

export function TrialCountdown({ daysRemaining, onUpgradeClick }: TrialCountdownProps) {
  // Determine color based on days remaining
  const getColorClasses = () => {
    if (daysRemaining > 7) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        button: 'bg-emerald-600 hover:bg-emerald-700'
      };
    } else if (daysRemaining > 3) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: 'text-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      };
    }
  };

  const colors = getColorClasses();
  const Icon = daysRemaining <= 3 ? AlertCircle : Gift;

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm`}>
      <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colors.text}`}>
          {daysRemaining === 1 ? (
            'Último dia de teste!'
          ) : daysRemaining === 0 ? (
            'Teste encerrado hoje'
          ) : (
            `Teste Pro: ${daysRemaining} dias restantes`
          )}
        </p>
        {daysRemaining <= 3 && (
          <p className="text-xs text-slate-500">
            Faça upgrade para manter os recursos Pro
          </p>
        )}
      </div>
      <button
        onClick={onUpgradeClick}
        className={`${colors.button} text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap`}
      >
        Ver Planos
      </button>
    </div>
  );
}

