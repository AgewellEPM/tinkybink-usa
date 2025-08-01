'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Step {
  emoji: string;
  text: string;
  time: string;
}

interface Routines {
  [key: string]: Step[];
}

export function DailyRoutineBuilder({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const routines: Routines = {
    'Morning Routine': [
      { emoji: '⏰', text: 'Wake up', time: '7:00 AM' },
      { emoji: '🦷', text: 'Brush teeth', time: '7:15 AM' },
      { emoji: '🚿', text: 'Take shower', time: '7:30 AM' },
      { emoji: '👕', text: 'Get dressed', time: '7:45 AM' },
      { emoji: '🥣', text: 'Eat breakfast', time: '8:00 AM' }
    ],
    'Bedtime Routine': [
      { emoji: '🛁', text: 'Take bath', time: '7:00 PM' },
      { emoji: '👔', text: 'Put on pajamas', time: '7:30 PM' },
      { emoji: '🦷', text: 'Brush teeth', time: '7:45 PM' },
      { emoji: '📖', text: 'Read story', time: '8:00 PM' },
      { emoji: '😴', text: 'Go to sleep', time: '8:30 PM' }
    ]
  };
  
  const [currentRoutine, setCurrentRoutine] = useState('Morning Routine');
  const [userRoutine, setUserRoutine] = useState<Step[]>([]);
  const [shuffledSteps, setShuffledSteps] = useState<Step[]>([]);

  const updateShuffledSteps = () => {
    const routine = routines[currentRoutine];
    const shuffled = [...routine].sort(() => Math.random() - 0.5);
    setShuffledSteps(shuffled);
  };

  // Initialize game
  useState(() => {
    updateShuffledSteps();
  });

  const switchRoutine = (routineName: string) => {
    setCurrentRoutine(routineName);
    setUserRoutine([]);
    setTimeout(updateShuffledSteps, 100);
  };

  const addRoutineStep = (step: Step) => {
    setUserRoutine([...userRoutine, step]);
    speak('Added: ' + step.text);
  };

  const removeRoutineStep = (index: number) => {
    const step = userRoutine[index];
    const newUserRoutine = [...userRoutine];
    newUserRoutine.splice(index, 1);
    setUserRoutine(newUserRoutine);
    speak('Removed: ' + step.text);
  };

  const resetRoutine = () => {
    setUserRoutine([]);
  };

  const routine = routines[currentRoutine];
  const availableSteps = shuffledSteps.filter(step => !userRoutine.includes(step));

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
      backdropFilter: 'blur(4px)',
      overflowY: 'auto'
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
        position: 'relative',
        margin: '30px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>📅 Daily Routine Builder</h2>
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
          <p style={{ marginBottom: '16px' }}>Build your {currentRoutine}!</p>
          
          <div style={{ marginBottom: '24px' }}>
            {Object.keys(routines).map(name => (
              <button
                key={name}
                onClick={() => switchRoutine(name)}
                style={{
                  background: name === currentRoutine ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  margin: '4px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = name === currentRoutine ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
              >
                {name}
              </button>
            ))}
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '600' }}>Your Routine (in order):</h4>
            <div style={{ minHeight: '96px' }}>
              {userRoutine.map((step, index) => (
                <div
                  key={index}
                  onClick={() => removeRoutineStep(index)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    margin: '4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>{step.emoji}</span>
                  <span style={{ marginRight: '8px' }}>{step.text}</span>
                  <small style={{ opacity: 0.7 }}>({step.time})</small>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {availableSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => addRoutineStep(step)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{step.emoji}</div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>{step.text}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{step.time}</div>
              </button>
            ))}
          </div>
          
          {userRoutine.length === routine.length && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '20px', marginBottom: '16px' }}>🎉 Perfect routine!</h4>
              <button 
                onClick={resetRoutine}
                style={{
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: 'none',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
              >
                🔄 Build Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}