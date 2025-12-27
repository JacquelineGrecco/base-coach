import React from 'react';
import { Trophy, Target, Lightbulb, Brain, Activity } from 'lucide-react';

type InsightType = 'strength' | 'weakness' | 'recommendation' | 'tactical' | 'fitness';

interface InsightCardProps {
  type: InsightType;
  title: string;
  items: string[];
}

const INSIGHT_CONFIG = {
  strength: {
    icon: Trophy,
    gradient: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  weakness: {
    icon: Target,
    gradient: 'from-orange-50 to-yellow-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
  },
  recommendation: {
    icon: Lightbulb,
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  tactical: {
    icon: Brain,
    gradient: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
  fitness: {
    icon: Activity,
    gradient: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({ type, title, items }) => {
  const config = INSIGHT_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-br ${config.gradient} rounded-xl border-2 ${config.border} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`${config.iconBg} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <h4 className="font-bold text-slate-900 text-lg tracking-tight">{title}</h4>
      </div>
      
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-slate-700">
            <span className={`${config.iconColor} font-bold mt-0.5 text-lg`}>
              {type === 'strength' ? '✓' : type === 'weakness' ? '○' : '→'}
            </span>
            <span className="flex-1 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


