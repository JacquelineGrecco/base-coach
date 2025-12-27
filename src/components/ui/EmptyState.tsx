'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export type EmptyStateVariant = 'default' | 'error' | 'info';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'success';
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: EmptyStateVariant;
  className?: string;
}

const variantStyles: Record<EmptyStateVariant, { iconBg: string; iconColor: string }> = {
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-400',
  },
  error: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-400',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-400',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {/* Icon Circle */}
      <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${styles.iconBg} flex items-center justify-center`}>
        <Icon className={`w-12 h-12 ${styles.iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              icon={action.icon}
              iconPosition="left"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'secondary'}
              onClick={secondaryAction.onClick}
              icon={secondaryAction.icon}
              iconPosition="left"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for inline use
export const EmptyStateCompact: React.FC<Omit<EmptyStateProps, 'className'>> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-8 px-4">
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 font-medium mb-2">{title}</p>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="sm"
          onClick={action.onClick}
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};


