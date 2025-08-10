'use client';

import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
  gradient?: string;
}

export function GameContainer({
  children,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}: GameContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: gradient,
        borderRadius: '20px',
        width: '90vw',
        maxWidth: '1200px',
        height: '85vh',
        maxHeight: '800px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Decorative background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}

export default GameContainer;