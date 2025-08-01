'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Categories {
  [key: string]: string[];
}

export function MatchTheSame({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const categories: Categories = {
    colors: ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
    fruits: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝'],
    shapes: ['⭐', '❤️', '🔵', '🔷', '🔺', '⬜']
  };
  
  const [currentCategory, setCurrentCategory] = useState<string>('colors');
  const [targetItem, setTargetItem] = useState<string>('');
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [shuffledItems, setShuffledItems] = useState<string[]>([]);

  const startNewRound = () => {
    const items = categories[currentCategory];
    const newTarget = items[Math.floor(Math.random() * items.length)];
    const newShuffled = [...items].sort(() => Math.random() - 0.5);
    
    setTargetItem(newTarget);
    setShuffledItems(newShuffled);
  };

  // Initialize game
  useState(() => {
    startNewRound();
  });

  const checkMatch = (selected: string) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (selected === targetItem) {
      setScore(score + 1);
      speak('Perfect match!');
    } else {
      speak('Not quite! Try again.');
    }
    
    setTimeout(() => {
      startNewRound();
    }, 1000);
  };

  const switchCategory = (cat: string) => {
    setCurrentCategory(cat);
    setTimeout(() => {
      startNewRound();
    }, 100);
  };

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
          <h2 style={{ margin: 0, fontSize: '24px' }}>🎯 Match the Same</h2>
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
          <p style={{ marginBottom: '16px' }}>Find the matching {currentCategory.slice(0, -1)}: <span style={{ fontSize: '48px' }}>{targetItem}</span></p>
          <p style={{ marginBottom: '24px' }}>Score: {score}/{rounds}</p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            maxWidth: '300px',
            margin: '0 auto 24px'
          }}>
            {shuffledItems.map((item, index) => (
              <button
                key={index}
                onClick={() => checkMatch(item)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '48px',
                  padding: '15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {item}
              </button>
            ))}
          </div>
          
          <div>
            <div style={{ marginBottom: '8px', fontSize: '14px' }}>Category:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {Object.keys(categories).map(cat => (
                <button
                  key={cat}
                  onClick={() => switchCategory(cat)}
                  style={{
                    background: cat === currentCategory ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseOut={(e) => e.currentTarget.style.background = cat === currentCategory ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}