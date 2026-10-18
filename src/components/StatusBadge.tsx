import React from 'react';
import { ItemStatus } from '../lib/constants.ts';

export interface StatusBadgeProps {
  status: ItemStatus | 'lost' | 'found';
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showSubtext = false,
  className = '',
  customLabel,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 border-[2px] tracking-widest',
    md: 'text-xs px-3 py-1 border-[2.25px] tracking-wider',
    lg: 'text-sm px-4 py-1.5 border-[2.75px] tracking-wider',
  };

  if (status === 'returned') {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <span
          className={`rubber-stamp stamp-returned ${sizeStyles[size]} shadow-xs font-black`}
        >
          {customLabel || 'RETURNED'}
        </span>
        {showSubtext && (
          <span className="text-[10px] font-mono text-[#0E6251] font-bold tracking-tight mt-0.5 bg-[#FCF8F2] px-1.5 py-0.2 rounded border border-[#0E6251]/20">
            Item linked to its owner
          </span>
        )}
      </div>
    );
  }

  if (status === 'claimed') {
    return (
      <span
        className={`rubber-stamp stamp-found ${sizeStyles[size]} -rotate-2 ${className}`}
      >
        {customLabel || 'CLAIM APPROVED'}
      </span>
    );
  }

  if (status === 'in_review') {
    return (
      <span
        className={`rubber-stamp stamp-review ${sizeStyles[size]} ${className}`}
      >
        {customLabel || 'IN REVIEW'}
      </span>
    );
  }

  if (status === 'lost') {
    return (
      <span
        className={`rubber-stamp stamp-lost ${sizeStyles[size]} ${className}`}
      >
        {customLabel || 'LOST'}
      </span>
    );
  }

  if (status === 'found' || status === 'unclaimed') {
    return (
      <span
        className={`rubber-stamp stamp-found ${sizeStyles[size]} ${className}`}
      >
        {customLabel || 'FOUND'}
      </span>
    );
  }

  if (status === 'archived') {
    return (
      <span
        className={`rubber-stamp text-[#6B6258] border-[#8C7E70] bg-[#6B6258]/10 rotate-1 ${sizeStyles[size]} ${className}`}
      >
        {customLabel || 'ARCHIVED'}
      </span>
    );
  }

  return (
    <span
      className={`rubber-stamp stamp-found ${sizeStyles[size]} ${className}`}
    >
      {customLabel || 'FOUND'}
    </span>
  );
};
