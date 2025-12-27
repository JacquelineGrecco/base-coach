'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-slate-100 text-slate-800 border-slate-200',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

// Dot variant for status indicators
export const BadgeDot: React.FC<Omit<BadgeProps, 'icon'>> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) => {
  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    neutral: 'bg-slate-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  );
};


