import React from 'react';
import { Spinner } from './Spinner.tsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'teal' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-[#0E6251] text-white hover:bg-[#09473A] active:bg-[#07362C] focus-visible:ring-[#0E6251] shadow-sm',
    teal:
      'bg-[#0E6251] text-white hover:bg-[#09473A] active:bg-[#07362C] focus-visible:ring-[#0E6251] shadow-sm',
    orange:
      'bg-[#D94825] text-white hover:bg-[#A93315] active:bg-[#8B250D] focus-visible:ring-[#D94825] shadow-sm',
    danger:
      'bg-[#D94825] text-white hover:bg-[#A93315] active:bg-[#8B250D] focus-visible:ring-[#D94825] shadow-sm',
    secondary:
      'bg-[#1E1B18] text-[#FCF8F2] hover:bg-[#342F2A] active:bg-[#12100E] focus-visible:ring-[#1E1B18] shadow-sm',
    outline:
      'border-2 border-[#DECBB6] bg-[#FCF8F2] text-[#1E1B18] hover:bg-[#EFE4D3] hover:border-[#C4B19B] active:bg-[#E5D7C4] focus-visible:ring-[#8C6D4F] shadow-xs',
    ghost:
      'text-[#6B6258] hover:bg-[#EAE0D0] hover:text-[#1E1B18] active:bg-[#DECBB6] focus-visible:ring-[#8C6D4F]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-display',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color={variant === 'outline' || variant === 'ghost' ? 'text-[#0E6251]' : 'text-white'} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
