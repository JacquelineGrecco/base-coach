'use client';

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

export interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-xl border border-slate-200 shadow-sm',
  elevated: 'bg-white rounded-xl border border-slate-200 shadow-lg',
  outlined: 'bg-white rounded-xl border-2 border-slate-300',
  flat: 'bg-white rounded-xl',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
  hoverable = false,
}) => {
  const hoverClasses = hoverable || onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  
  return (
    <div
      className={`${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 border-b border-slate-200 ${className}`}>{children}</div>;
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl ${className}`}>{children}</div>;
};


