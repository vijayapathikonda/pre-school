import React from 'react';

interface SchoolLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-1.5 shadow-md border border-amber-400/40`}
      >
        {/* Academic School Crest SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Laurel Garland Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Central Shield Outline */}
          <path
            d="M50 14L24 24V48C24 66 35 81 50 86C65 81 76 66 76 48V24L50 14Z"
            fill="#1E1B4B"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Golden Sun / Knowledge Rays */}
          <circle cx="50" cy="38" r="8" fill="#F59E0B" />
          <path
            d="M50 25V28M50 48V51M37 38H40M60 38H63M41 29L43 31M57 45L59 47M41 47L43 45M57 29L59 31"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Open Knowledge Book */}
          <path
            d="M32 64C38 60 46 61 50 63C54 61 62 60 68 64V48C62 44 54 45 50 47C46 45 38 44 32 48V64Z"
            fill="#FFFFFF"
            stroke="#D97706"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M50 47V63" stroke="#D97706" strokeWidth="1.8" />

          {/* Stars */}
          <polygon points="50,71 52,75 56,75 53,77 54,81 50,79 46,81 47,77 44,75 48,75" fill="#FDE68A" />
        </svg>
      </div>

      {showText && (
        <div className="text-left">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Pragathi Vidyalaya School
          </h2>
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Inspiring Early Minds
          </p>
        </div>
      )}
    </div>
  );
};
