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
  const [shuffledItems, setShuffledItems] = useState<string[]>([]);

  const startRound = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    const allItems = colors.flatMap(c => c.items);
    let newShuffled = allItems.sort(() => Math.random() - 0.5).slice(0, 6);
    
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
    if (currentColor?.items.includes(item)) {
      speak('Correct! ' + item + ' is ' + currentColor.name + '!');
      // Add visual feedback here if needed
    } else {
      speak('Not quite! That\'s not ' + currentColor?.name + '.');
    }
  };

  const nextColorRound = () => {
    setRounds(rounds + 1);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>🎨 Pick the Color</h2>
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
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px' }}>
            Find all the <span style={{ fontSize: '36px' }}>{currentColor.emoji}</span> <strong>{currentColor.name}</strong> items!
          </p>
          <p style={{ marginBottom: '24px' }}>Score: {score}/{rounds}</p>
          
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
  );
}