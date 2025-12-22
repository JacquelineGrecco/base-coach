/**
 * Centralized tier color configuration for subscription tiers
 * Used across Pricing, UpgradeModals, and UpgradePrompts
 */

export type TierColor = 'slate' | 'blue' | 'purple' | 'emerald' | 'gray';

export interface TierColorScheme {
  bg: string;
  border: string;
  text: string;
  badge: string;
  button: string;
  icon: string;
  gradient?: string;
}

/**
 * Color schemes for subscription tiers
 */
export const TIER_COLOR_CLASSES: Record<string, TierColorScheme> = {
  free: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-700',
    button: 'bg-slate-600 hover:bg-slate-700 text-white',
    icon: 'text-slate-600',
  },
  pro: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-600',
    gradient: 'from-blue-600 to-indigo-600',
  },
  premium: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    icon: 'text-purple-600',
    gradient: 'from-purple-600 to-pink-600',
  },
  enterprise: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: 'text-emerald-600',
    gradient: 'from-gray-700 to-gray-900',
  },
};

/**
 * Gradient backgrounds for upgrade prompts
 */
export const TIER_GRADIENTS: Record<string, string> = {
  pro: 'from-blue-50 to-indigo-50',
  premium: 'from-purple-50 to-pink-50',
  enterprise: 'from-gray-50 to-slate-50',
};

/**
 * Border colors for tier cards
 */
export const TIER_BORDERS: Record<string, string> = {
  pro: 'border-blue-200',
  premium: 'border-purple-200',
  enterprise: 'border-gray-300',
};

/**
 * Helper to get tier color scheme
 */
export function getTierColors(tier: string): TierColorScheme {
  return TIER_COLOR_CLASSES[tier] || TIER_COLOR_CLASSES.free;
}

