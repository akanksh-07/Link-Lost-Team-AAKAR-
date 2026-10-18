import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: {
      bg: 'bg-[#E7F3F0] border-[#0E6251]/40 text-[#09473A]',
      icon: <Info className="w-5 h-5 text-[#0E6251] shrink-0" />,
    },
    success: {
      bg: 'bg-[#EAF5E9] border-[#15803D]/40 text-[#14532D]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]',
      icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
    },
    error: {
      bg: 'bg-[#FCECE8] border-[#D94825]/40 text-[#A93315]',
      icon: <AlertCircle className="w-5 h-5 text-[#D94825] shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      className={`border-2 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm font-sans ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-display font-bold mb-0.5">{title}</h4>}
        {message && <p className="leading-relaxed">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-[#8C7E70] hover:text-[#1E1B18] p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
