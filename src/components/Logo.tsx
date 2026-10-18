import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Luggage Tag Logo Mark whose string loop forms an interlocking chain link.
 * Crisp and identifiable from 16px to 64px.
 */
export const LostLinkLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Lost-Link tag mark"
    >
      {/* Chain link string loop attached to tag eyelet */}
      <path
        d="M24 14C24 9.5 28.5 6 32.5 6C36.5 6 39.5 9 39.5 13C39.5 17 35.5 20.5 31.5 20.5"
        stroke="#8C6D4F"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <path
        d="M27 9.5C23.5 12 20 15 20 19"
        stroke="#8C6D4F"
        strokeWidth="2.75"
        strokeLinecap="round"
      />

      {/* Luggage Tag Body */}
      <path
        d="M10 22L20 12H34C36.2091 12 38 13.7909 38 16V40C38 42.2091 36.2091 44 34 44H14C11.7909 44 10 42.2091 10 40V22Z"
        fill="#FCF8F2"
        stroke="#1E1B18"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Reinforced Eyelet Hole */}
      <circle cx="20" cy="18" r="3" fill="#F4ECE1" stroke="#8C6D4F" strokeWidth="2" />

      {/* Perforated tear line near bottom */}
      <line
        x1="13"
        y1="34"
        x2="35"
        y2="34"
        stroke="#DECBB6"
        strokeWidth="2"
        strokeDasharray="2 3"
        strokeLinecap="round"
      />

      {/* Ticket Stamp Accent: Teall/Orange duo bar */}
      <rect x="15" y="24" width="7" height="4" rx="1" fill="#D94825" />
      <rect x="24" y="24" width="9" height="4" rx="1" fill="#0E6251" />
    </svg>
  );
};

/**
 * Lost-Link Wordmark: "Lost" and "Link" joined by a hyphen rendered as a tactile chain link SVG.
 */
export const LostLinkWordmark: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  dark?: boolean;
}> = ({ size = 'md', className = '', dark = false }) => {
  const fontSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const linkSvgSizes = {
    sm: { w: 20, h: 10 },
    md: { w: 24, h: 12 },
    lg: { w: 28, h: 14 },
    xl: { w: 34, h: 17 },
  };

  const textColor = dark ? 'text-white' : 'text-[#1E1B18]';
  const svg = linkSvgSizes[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display font-extrabold tracking-tight ${fontSizes[size]} ${textColor} ${className}`}
    >
      <span className="text-[#D94825] font-black">Lost</span>

      {/* Hyphen drawn as an interlocking chain link */}
      <svg
        width={svg.w}
        height={svg.h}
        viewBox="0 0 32 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-110"
        aria-hidden="true"
      >
        {/* Left Link Loop (Orange) */}
        <rect
          x="1.5"
          y="2.5"
          width="17"
          height="11"
          rx="5.5"
          stroke="#D94825"
          strokeWidth="3"
        />
        {/* Right Interlocking Link Loop (Teal) */}
        <rect
          x="13.5"
          y="2.5"
          width="17"
          height="11"
          rx="5.5"
          stroke="#0E6251"
          strokeWidth="3"
        />
      </svg>

      <span className="text-[#0E6251] font-black">Link</span>
    </span>
  );
};
