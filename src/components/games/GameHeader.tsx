'use client';

import React from 'react';

interface GameHeaderProps {
  title: string;
  icon: string;
  score: number;
  rounds: number;
  streak?: number;
  bestStreak?: number;
  accuracy?: number;
  level?: string;
  onClose: () => void;
  gradient?: string;
}

export function GameHeader({
  title,
  icon,
  score,
  rounds,
  streak = 0,
  bestStreak = 0,
  accuracy,
  level,
  onClose,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}: GameHeaderProps) {
  // Calculate accuracy if not provided
  const displayAccuracy = accuracy !== undefined 
    ? accuracy 
    : rounds > 0 ? Math.round((score / rounds) * 100) : 0;

  return (
    <>
      {/* Top Bar with Stats */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        minHeight: '70px'
      }}>
        {/* Left Stats */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                {score}/{rounds}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>SCORE</div>
            </div>
          </div>
          
          {streak !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: streak > 0 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '20px'
            }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: streak > 0 ? '#ffeb3b' : 'white' 
                }}>
                  {streak}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>STREAK</div>
              </div>
            </div>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: displayAccuracy >= 80 ? '#4caf50' : displayAccuracy >= 60 ? '#ff9800' : '#f44336'
              }}>
                {displayAccuracy}%
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>ACCURACY</div>
            </div>
          </div>
        </div>

        {/* Center Title */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {title}
          </h2>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {level && (
            <div style={{
              background: level === 'easy' ? 'rgba(76, 175, 80, 0.2)' : 
                        level === 'medium' ? 'rgba(255, 152, 0, 0.2)' : 
                        'rgba(244, 67, 54, 0.2)',
              border: `1px solid ${level === 'easy' ? '#4caf50' : 
                                   level === 'medium' ? '#ff9800' : 
                                   '#f44336'}`,
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: level === 'easy' ? '#4caf50' : 
                     level === 'medium' ? '#ff9800' : 
                     '#f44336',
              textTransform: 'uppercase'
            }}>
              {level}
            </div>
          )}
          
          {bestStreak > 0 && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid #ffd700',
              padding: '6px 12px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>🏆</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffd700' }}>
                {bestStreak}
              </span>
            </div>
          )}
          
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}

export default GameHeader;