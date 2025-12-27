'use client';

import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'blue' | 'emerald' | 'slate' | 'white';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-2',
  lg: 'h-16 w-16 border-4',
};

const colorClasses: Record<SpinnerColor, string> = {
  blue: 'border-blue-600 border-t-transparent',
  emerald: 'border-emerald-600 border-t-transparent',
  slate: 'border-slate-600 border-t-transparent',
  white: 'border-white border-t-transparent',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = '',
  label,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        role="status"
        aria-label={label || 'Loading'}
      >
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
      {label && (
        <p className="text-sm text-slate-600 font-medium">{label}</p>
      )}
    </div>
  );
};

// Centered version for full-page loading
export const LoadingSpinnerFullPage: React.FC<Omit<LoadingSpinnerProps, 'className'>> = (props) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <LoadingSpinner {...props} />
    </div>
  );
};


