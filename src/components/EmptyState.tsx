import React from 'react';
import { Tag } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-[#DECBB6] rounded-3xl bg-[#FCF8F2]/70 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#EFE4D3] flex items-center justify-center text-[#8C6D4F] mb-4 border border-[#DECBB6]">
        {icon || <Tag className="w-8 h-8 text-[#8C6D4F]" />}
      </div>
      <h3 className="text-lg font-display font-extrabold text-[#1E1B18] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6B6258] max-w-sm mb-6 leading-relaxed font-sans">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
