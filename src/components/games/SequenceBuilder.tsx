'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface SequenceData {
  name: string;
  steps: string[];
  description: string;
}

export function SequenceBuilder({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const sequences: SequenceData[] = [
    {
      name: 'Making a Sandwich',
      description: 'Put these steps in the right order to make a sandwich:',
      steps: ['🍞 Get bread', '🧈 Spread butter', '🍖 Add meat', '🥬 Add lettuce', '🍞 Top with bread']
    },
    {
      name: 'Getting Ready for School',
      description: 'Put these morning activities in order:',
      steps: ['⏰ Wake up', '🚿 Take shower', '👕 Get dressed', '🍳 Eat breakfast', '🎒 Pack backpack']
    },
    {
      name: 'Brushing Teeth',
      description: 'What\'s the right order to brush your teeth?',
      steps: ['🦷 Get toothbrush', '🧴 Add toothpaste', '🚰 Wet brush', '🪥 Brush teeth', '💧 Rinse mouth']
    },
    {
      name: 'Getting Dressed',
      description: 'Put on clothes in the right order:',
      steps: ['👙 Put on underwear', '🧦 Put on socks', '👖 Put on pants', '👕 Put on shirt', '👟 Put on shoes']
    },
    {
      name: 'Washing Hands',
      description: 'Show the correct handwashing steps:',
      steps: ['🚰 Turn on water', '🧼 Get soap', '🤲 Rub hands together', '💧 Rinse with water', '🗞️ Dry with towel']
    }
  ];
  
  const [currentSequence, setCurrentSequence] = useState<SequenceData>(sequences[0]);
  const [playerOrder, setPlayerOrder] = useState<string[]>([]);
  const [availableSteps, setAvailableSteps] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const startNewSequence = (sequence?: SequenceData) => {
    const seq = sequence || sequences[Math.floor(Math.random() * sequences.length)];
    setCurrentSequence(seq);
    setPlayerOrder([]);
    setAvailableSteps([...seq.steps].sort(() => Math.random() - 0.5));
    setIsComplete(false);
    setFeedback('');
  };

  // Initialize game
  useState(() => {
    startNewSequence();
  });

  const addStep = (step: string) => {
    if (isComplete) return;
    
    const newPlayerOrder = [...playerOrder, step];
    const newAvailableSteps = availableSteps.filter(s => s !== step);
    
    setPlayerOrder(newPlayerOrder);
    setAvailableSteps(newAvailableSteps);
    
    // Check if sequence is complete
    if (newPlayerOrder.length === currentSequence.steps.length) {
      const isCorrect = newPlayerOrder.every((step, index) => step === currentSequence.steps[index]);
      
      const newRounds = rounds + 1;
      setRounds(newRounds);
      
      if (isCorrect) {
        const newScore = score + 1;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);
        if (newScore > bestScore) {
          setBestScore(newScore);
        }
        setIsComplete(true);
        setFeedback('Perfect! You got the sequence right!');
        speak('Amazing! You put everything in the perfect order!');
      } else {
        setStreak(0);
        setFeedback('Not quite right. Try again!');
        speak('Almost there! Let\'s try putting them in order again.');
        setTimeout(() => {
          setPlayerOrder([]);
          setAvailableSteps([...currentSequence.steps].sort(() => Math.random() - 0.5));
          setFeedback('');
        }, 2000);
      }
    }
  };

  const removeStep = (index: number) => {
    if (isComplete) return;
    
    const stepToRemove = playerOrder[index];
    const newPlayerOrder = playerOrder.filter((_, i) => i !== index);
    const newAvailableSteps = [...availableSteps, stepToRemove];
    
    setPlayerOrder(newPlayerOrder);
    setAvailableSteps(newAvailableSteps);
  };

  const resetSequence = () => {
    startNewSequence(currentSequence);
  };

  const nextSequence = () => {
    startNewSequence();
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
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentSequence.steps.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Steps</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>📋 Sequence Builder</h2>
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
          <h3 style={{ marginBottom: '10px' }}>{currentSequence.name}</h3>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>{currentSequence.description}</p>
          
          {feedback && (
            <div style={{
              background: isComplete ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `2px solid ${isComplete ? 'rgba(40, 167, 69, 0.5)' : 'rgba(220, 53, 69, 0.5)'}`
            }}>
              {feedback}
            </div>
          )}
          
          {/* Player's sequence */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Your Sequence:</h4>
            <div style={{
              minHeight: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '10px',
              border: '2px dashed rgba(255,255,255,0.3)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {playerOrder.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                  Drag steps here or click them below
                </div>
              ) : (
                playerOrder.map((step, index) => (
                  <div
                    key={index}
                    onClick={() => removeStep(index)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ 
                      background: 'rgba(255,255,255,0.3)', 
                      borderRadius: '50%', 
                      width: '20px', 
                      height: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '12px' 
                    }}>
                      {index + 1}
                    </span>
                    {step}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Available steps */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Available Steps:</h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {availableSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => addStep(step)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '14px',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
          
          {/* Control buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={resetSequence}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Reset
            </button>
            <button
              onClick={nextSequence}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⏭️ Next Activity
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}