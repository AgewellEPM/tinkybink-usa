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

  const nextSandwichStep = () => {
    const step = steps[currentStep];
    speak(step.text + ' - Good job!');
    
    if (currentStep + 1 >= steps.length) {
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
          <h2 style={{ margin: 0, fontSize: '24px' }}>🥪 Make a Sandwich</h2>
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
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>Step {step.step} of {steps.length}</p>
          
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
  );
}