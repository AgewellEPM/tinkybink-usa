'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Color {
  name: string;
  emoji: string;
  items: string[];
}

export function PickTheColor({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const colors: Color[] = [
    { name: 'red', emoji: '🔴', items: ['apple 🍎', 'strawberry 🍓', 'fire truck 🚒'] },
    { name: 'blue', emoji: '🔵', items: ['sky ☁️', 'ocean 🌊', 'blueberry 🫐'] },
    { name: 'green', emoji: '🟢', items: ['grass 🌱', 'frog 🐸', 'broccoli 🥦'] },
    { name: 'yellow', emoji: '🟡', items: ['sun ☀️', 'banana 🍌', 'lemon 🍋'] }
  ];
  
  const [currentColor, setCurrentColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [shuffledItems, setShuffledItems] = useState<string[]>([]);

  const startRound = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    const allItems = colors.flatMap(c => c.items);
    const newShuffled = allItems.sort(() => Math.random() - 0.5).slice(0, 6);
    
    // Ensure at least one correct item is included
    if (!newShuffled.some(item => newColor.items.includes(item))) {
      newShuffled[0] = newColor.items[Math.floor(Math.random() * newColor.items.length)];
    }
    
    setCurrentColor(newColor);
    setShuffledItems(newShuffled);
  };

  // Initialize game
  useState(() => {
    startRound();
  });

  const selectColorItem = (item: string) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (currentColor?.items.includes(item)) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      speak('Correct! ' + item + ' is ' + currentColor.name + '!');
    } else {
      setStreak(0);
      speak('Not quite! That\'s not ' + currentColor?.name + '.');
    }
  };

  const nextColorRound = () => {
    startRound();
  };

  if (!currentColor) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
        borderRadius: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        color: 'white',
        position: 'relative'
      }}>
        {/* Top Score Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '15px 20px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}/{rounds}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: streak > 0 ? '#ffeb3b' : 'white' }}>🔥{streak}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>🏆{bestScore}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Best</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>{currentColor?.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Color</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🎨 Pick the Color</h2>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✖
            </button>
          </div>
        </div>
        
        <div style={{ padding: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px' }}>
            Find all the <span style={{ fontSize: '36px' }}>{currentColor.emoji}</span> <strong>{currentColor.name}</strong> items!
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            maxWidth: '400px',
            margin: '0 auto 24px'
          }}>
            {shuffledItems.map((item, index) => (
              <button
                key={index}
                onClick={() => selectColorItem(item)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '16px',
                  padding: '20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {item}
              </button>
            ))}
          </div>
          
          <button 
            onClick={nextColorRound}
            style={{
              background: 'rgba(59, 130, 246, 0.3)',
              border: 'none',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
          >
            ➡️ Next Color
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}