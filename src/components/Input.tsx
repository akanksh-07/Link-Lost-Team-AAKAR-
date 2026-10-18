import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  required,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5"
        >
          {label}
          {required && <span className="text-[#D94825] ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-2xs">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7E70]">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`block w-full rounded-xl text-sm text-[#1E1B18] bg-[#FCF8F2] placeholder-[#A69584] border-2 transition-all duration-150 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#EAE0D0] disabled:text-[#8C7E70] disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-[#D94825] focus:border-[#D94825] focus:ring-[#D94825]/20'
              : 'border-[#DECBB6] hover:border-[#C4B19B] focus:border-[#0E6251] focus:ring-[#0E6251]/20'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C7E70]">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-[#D94825] font-semibold flex items-center gap-1 font-mono">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-[#6B6258] font-sans">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
