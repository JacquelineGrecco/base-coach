import React from 'react';
import { Gift, Clock } from 'lucide-react';

interface TrialCountdownProps {
  trialEndsAt: string;
  onUpgradeClick: () => void;
}

export function TrialCountdown({ trialEndsAt, onUpgradeClick }: TrialCountdownProps) {
  const daysLeft = Math.ceil(
    (new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    return null; // Trial expired
  }

  // Color coding based on days left
  const getColorClasses = () => {
    if (daysLeft >= 7) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'text-emerald-600'
      };
    } else if (daysLeft >= 3) {
      return {
        bg: 'bg-yellow-50 hover:bg-yellow-100',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: 'text-yellow-600'
      };
    } else {
      return {
        bg: 'bg-red-50 hover:bg-red-100',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-600'
      };
    }
  };

  const colors = getColorClasses();

  return (
    <button
      onClick={onUpgradeClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${colors.bg} ${colors.border} ${colors.text} transition-colors font-medium text-sm shadow-sm`}
      title="Clique para fazer upgrade"
    >
      <Gift className={`w-4 h-4 ${colors.icon}`} />
      <span className="hidden sm:inline">Teste Pro:</span>
      <span className="font-bold flex items-center gap-1">
        {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} restante{daysLeft !== 1 ? 's' : ''}
        <Clock className="w-3 h-3" />
      </span>
    </button>
  );
}
