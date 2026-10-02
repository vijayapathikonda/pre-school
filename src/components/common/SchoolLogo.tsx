import React from 'react';
import schoolLogoImg from '../../assets/school_logo.png';

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
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center shrink-0 rounded-2xl bg-white p-1 shadow-md border border-slate-200 dark:border-amber-400/40 overflow-hidden`}
      >
        <img
          src={schoolLogoImg}
          alt="Pragathi Vidyalaya School Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="text-left">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Pragathi Vidyalaya School
          </h2>
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            विद्या विन्दते बलम्
          </p>
        </div>
      )}
    </div>
  );
};
