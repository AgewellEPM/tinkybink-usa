'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Sound {
  animal: string;
  emoji: string;
  sound: string;
  options: string[];
}

export function SoundMatching({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const sounds: Sound[] = [
    { animal: 'Dog', emoji: '🐶', sound: 'Woof! Woof!', options: ['Woof! Woof!', 'Meow! Meow!', 'Moo! Moo!'] },
    { animal: 'Cat', emoji: '🐱', sound: 'Meow! Meow!', options: ['Woof! Woof!', 'Meow! Meow!', 'Oink! Oink!'] },
    { animal: 'Cow', emoji: '🐄', sound: 'Moo! Moo!', options: ['Meow! Meow!', 'Moo! Moo!', 'Quack! Quack!'] },
    { animal: 'Duck', emoji: '🦆', sound: 'Quack! Quack!', options: ['Quack! Quack!', 'Oink! Oink!', 'Woof! Woof!'] },
    { animal: 'Pig', emoji: '🐷', sound: 'Oink! Oink!', options: ['Moo! Moo!', 'Oink! Oink!', 'Meow! Meow!'] }
  ];
  
  const [currentSound, setCurrentSound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const playAnimalSound = () => {
    const sound = sounds[currentSound];
    speak(sound.sound);
  };

  const selectSound = (selected: string) => {
    const sound = sounds[currentSound];
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (selected === sound.sound) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      speak('Correct! ' + sound.animal + ' says ' + sound.sound);
    } else {
      setStreak(0);
      speak('Try again! ' + sound.animal + ' says ' + sound.sound);
    }
    
    setTimeout(() => {
      if (currentSound + 1 >= sounds.length) {
        setGameComplete(true);
      } else {
        setCurrentSound(currentSound + 1);
      }
    }, 2000);
  };

  const resetSoundGame = () => {
    setCurrentSound(0);
    setScore(0);
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
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          color: 'white',
          position: 'relative',
          textAlign: 'center'
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
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>🔊 Sound Matching</h2>
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
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>🎉 Game Complete!</h3>
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>Final Score: {score}/{sounds.length}</p>
            <button 
              onClick={resetSoundGame}
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

  const sound = sounds[currentSound];

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
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentSound + 1}/{sounds.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Animal</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🔊 Sound Matching</h2>
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
          <p style={{ marginBottom: '16px' }}>What sound does this animal make?</p>
          
          <div style={{ fontSize: '80px', marginBottom: '32px' }}>{sound.emoji}</div>
          <div style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>{sound.animal}</div>
          
          <button 
            onClick={playAnimalSound}
            style={{
              background: 'rgba(234, 179, 8, 0.3)',
              border: 'none',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '10px',
              cursor: 'pointer',
              marginBottom: '24px',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.5)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.3)'}
          >
            🔊 Play Sound
          </button>
          
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            {sound.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectSound(option)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '18px',
                  padding: '15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}