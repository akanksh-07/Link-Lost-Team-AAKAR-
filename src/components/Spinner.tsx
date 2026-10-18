import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      aria-label="Linking..."
      className={`inline-flex items-center justify-center animate-spin ${sizeClasses[size]} ${className}`}
    >
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Top-Left Oval Chain Link (Orange) */}
        <rect
          x="4"
          y="6"
          width="16"
          height="10"
          rx="5"
          transform="rotate(-45 4 6)"
          stroke="#D94825"
          strokeWidth="3.2"
        />
        {/* Bottom-Right Interlocking Chain Link (Teal) */}
        <rect
          x="12"
          y="14"
          width="16"
          height="10"
          rx="5"
          transform="rotate(-45 12 14)"
          stroke="#0E6251"
          strokeWidth="3.2"
        />
      </svg>
    </div>
  );
};
