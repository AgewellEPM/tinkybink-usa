'use client';

import React from 'react';

interface GameCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  number?: number;
  gradient?: string;
  disabled?: boolean;
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function GameCard({
  children,
  onClick,
  number,
  gradient = 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
  disabled = false,
  selected = false,
  correct = false,
  incorrect = false,
  size = 'medium'
}: GameCardProps) {
  const sizes = {
    small: { padding: '15px', minHeight: '80px', fontSize: '14px' },
    medium: { padding: '25px', minHeight: '120px', fontSize: '16px' },
    large: { padding: '35px', minHeight: '160px', fontSize: '20px' }
  };

  const currentSize = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        background: selected ? gradient : 'rgba(255, 255, 255, 0.05)',
        border: selected ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: currentSize.padding,
        minHeight: currentSize.minHeight,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: currentSize.fontSize,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
        opacity: disabled ? 0.5 : 1,
        transform: selected ? 'scale(0.98)' : 'scale(1)',
        boxShadow: selected 
          ? '0 10px 30px rgba(108, 92, 231, 0.3)' 
          : correct 
            ? '0 10px 30px rgba(76, 175, 80, 0.4)'
            : incorrect
              ? '0 10px 30px rgba(244, 67, 54, 0.4)'
              : '0 5px 15px rgba(0, 0, 0, 0.2)',
        ...(correct && {
          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
          border: '2px solid #4caf50',
          animation: 'pulse 0.5s ease'
        }),
        ...(incorrect && {
          background: 'linear-gradient(135deg, #f44336 0%, #da190b 100%)',
          border: '2px solid #f44336',
          animation: 'shake 0.5s ease'
        })
      }}
      onMouseOver={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(108, 92, 231, 0.3)';
          e.currentTarget.style.background = gradient;
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }
      }}
    >
      {number && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          {number}
        </div>
      )}
      
      {children}
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </button>
  );
}

export default GameCard;