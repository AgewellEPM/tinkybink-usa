'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Step {
  step: number;
  emoji: string;
  text: string;
  action: string;
}

export function MakeASandwich({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const steps: Step[] = [
    { step: 1, emoji: '🍞', text: 'Get two slices of bread', action: 'get_bread' },
    { step: 2, emoji: '🧈', text: 'Spread butter or mayo', action: 'spread' },
    { step: 3, emoji: '🥬', text: 'Add lettuce', action: 'add_lettuce' },
    { step: 4, emoji: '🍅', text: 'Add tomato slices', action: 'add_tomato' },
    { step: 5, emoji: '🧀', text: 'Add cheese', action: 'add_cheese' },
    { step: 6, emoji: '🥪', text: 'Put top slice on', action: 'finish' }
  ];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const nextSandwichStep = () => {
    const step = steps[currentStep];
    speak(step.text + ' - Good job!');
    
    if (currentStep + 1 >= steps.length) {
      // Completed a sandwich
      const newRounds = rounds + 1;
      const newScore = score + 1;
      const newStreak = streak + 1;
      setRounds(newRounds);
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      speak('Congratulations! You made a delicious sandwich!');
      setTimeout(() => {
        setCurrentStep(0);
      }, 2000);
    } else {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    }
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

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
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentStep + 1}/{steps.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Step</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🥪 Make a Sandwich</h2>
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
          
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>{step.emoji}</div>
          <p style={{ fontSize: '18px', marginBottom: '24px' }}>{step.text}</p>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '600' }}>Your Sandwich Progress:</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {steps.slice(0, currentStep + 1).map((s, index) => (
                <span key={index} style={{ fontSize: '36px' }}>{s.emoji}</span>
              ))}
            </div>
          </div>
          
          <button 
            onClick={nextSandwichStep}
            style={{
              background: 'rgba(34, 197, 94, 0.3)',
              border: 'none',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
          >
            {isLast ? '🎉 Sandwich Complete!' : '✅ Done!'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}