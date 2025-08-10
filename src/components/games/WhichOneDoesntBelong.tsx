'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface GameData {
  items: string[];
  odd: string;
  category: string;
}

export function WhichOneDoesntBelong({ onClose }: { onClose: () => void }) {
  console.log('WhichOneDoesntBelong component rendered!');
  const { speak } = useSpeech();
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const gameData: GameData[] = [
    { items: ['🍎', '🍌', '🍊', '🚗'], odd: '🚗', category: 'fruits vs vehicle' },
    { items: ['🐶', '🐱', '🐭', '🏠'], odd: '🏠', category: 'animals vs house' },
    { items: ['🔴', '🟢', '🔵', '📱'], odd: '📱', category: 'colors vs phone' },
    { items: ['👕', '👖', '👗', '🥪'], odd: '🥪', category: 'clothes vs food' },
    { items: ['⚽', '🏀', '🎾', '🚗'], odd: '🚗', category: 'sports vs vehicle' }
  ];

  const checkAnswer = (selected: string) => {
    const round = gameData[currentRound];
    const isCorrect = selected === round.odd;
    
    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      speak(`Correct! ${selected} doesn&apos;t belong!`);
    } else {
      setStreak(0);
      speak(`Try again! ${round.odd} doesn&apos;t belong.`);
    }
    
    setTimeout(() => {
      if (currentRound + 1 >= gameData.length) {
        setGameComplete(true);
      } else {
        setCurrentRound(currentRound + 1);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentRound(0);
    setScore(0);
    setStreak(0);
    setGameComplete(false);
  };

  if (gameComplete) {
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
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          color: 'white',
          position: 'relative',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>🧩 Which One Doesn&apos;t Belong?</h2>
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
          
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>🎉 Game Complete!</h3>
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>Final Score: {score}/{gameData.length}</p>
            <button 
              onClick={resetGame}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                margin: '10px'
              }}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const round = gameData[currentRound];

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
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}/{gameData.length}</div>
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
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>Round {currentRound + 1}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Progress</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🧩 Which One Doesn't Belong?</h2>
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
        
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '20px',
            fontWeight: '500',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            margin: '20px 0'
          }}>
            Which one doesn&apos;t belong? ({round.category})
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px', 
            margin: '20px auto', 
            maxWidth: '300px' 
          }}>
            {round.items.map((item, index) => (
              <button
                key={index}
                onClick={() => checkAnswer(item)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '60px',
                  padding: '20px',
                  borderRadius: '15px',
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
        </div>
      </div>
    </div>
  );
}