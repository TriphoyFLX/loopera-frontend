import React from 'react';

interface EyeIconProps {
  isOpen: boolean;
  size?: number;
  color?: string;
}

const EyeIcon: React.FC<EyeIconProps> = ({ isOpen, size = 20, color = 'currentColor' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {isOpen ? (
        // Открытый глаз
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        // Закрытый глаз
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 0-1.5.5-3-.09s-2.91-.91-2.83-.91z" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
};

export default EyeIcon;
