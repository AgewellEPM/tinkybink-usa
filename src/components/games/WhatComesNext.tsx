'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Pattern {
  name: string;
  sequence: string[];
  next: string;
  type: 'repeating' | 'counting' | 'alphabet' | 'size';
}

export function WhatComesNext({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const patterns: Pattern[] = [
    // Repeating patterns
    { name: 'Red Blue Pattern', sequence: ['🔴', '🔵', '🔴', '🔵', '🔴'], next: '🔵', type: 'repeating' },
    { name: 'Animal Pattern', sequence: ['🐶', '🐱', '🐶', '🐱', '🐶'], next: '🐱', type: 'repeating' },
    { name: 'Shape Pattern', sequence: ['⭐', '❤️', '⭐', '❤️', '⭐'], next: '❤️', type: 'repeating' },
    { name: 'Food Pattern', sequence: ['🍎', '🍌', '🍊', '🍎', '🍌'], next: '🍊', type: 'repeating' },
    
    // Counting patterns
    { name: 'Numbers', sequence: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'], next: '6️⃣', type: 'counting' },
    { name: 'Fingers', sequence: ['☝️', '✌️', '🤟', '🖐️'], next: '🖐️', type: 'counting' },
    
    // Alphabet patterns
    { name: 'Letters', sequence: ['🇦', '🇧', '🇨', '🇩'], next: '🇪', type: 'alphabet' },
    
    // Size patterns
    { name: 'Growing Circles', sequence: ['⚫', '🔴', '🟠', '🟡'], next: '🟢', type: 'size' },
    { name: 'Moon Phases', sequence: ['🌑', '🌒', '🌓', '🌔'], next: '🌕', type: 'size' }
  ];
  
  const [currentPattern, setCurrentPattern] = useState<Pattern>(patterns[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const generateOptions = (correctAnswer: string) => {
    // Create a pool of wrong answers based on pattern type
    const wrongOptions: string[] = [];
    
    if (currentPattern.type === 'repeating') {
      const usedInPattern = [...new Set(currentPattern.sequence)];
      wrongOptions.push(...usedInPattern.filter(item => item !== correctAnswer));
    }
    
    // Add some random emoji options
    const randomEmojis = ['🎈', '🌟', '🎯', '🎪', '🎨', '🎭', '🎪', '🦄', '🌈', '⚡'];
    wrongOptions.push(...randomEmojis.filter(e => e !== correctAnswer).slice(0, 2));
    
    // Take 3 wrong options and mix with correct answer
    const finalWrongOptions = wrongOptions.slice(0, 3);
    const allOptions = [correctAnswer, ...finalWrongOptions].sort(() => Math.random() - 0.5);
    
    return allOptions;
  };

  const startNewRound = () => {
    const newPattern = patterns[Math.floor(Math.random() * patterns.length)];
    setCurrentPattern(newPattern);
    setOptions(generateOptions(newPattern.next));
    setFeedback('');
  };

  // Initialize game
  useState(() => {
    startNewRound();
  });

  const checkAnswer = (selected: string) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (selected === currentPattern.next) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      setFeedback('Perfect! You found what comes next!');
      speak('Excellent! You figured out the pattern!');
    } else {
      setStreak(0);
      setFeedback('Not quite right. Look at the pattern carefully.');
      speak('Look closely at the pattern. What comes next?');
    }
    
    setTimeout(() => {
      startNewRound();
    }, 2000);
  };

  const getHint = () => {
    const hints = {
      repeating: 'Look for a pattern that repeats over and over!',
      counting: 'What number comes next in order?',
      alphabet: 'What letter comes next in the alphabet?',
      size: 'Notice how things are getting bigger or changing!'
    };
    
    const hint = hints[currentPattern.type];
    setFeedback(`💡 Hint: ${hint}`);
    speak(hint);
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
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentPattern.type.toUpperCase()}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Pattern</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>➡️ What Comes Next?</h2>
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
          <h3 style={{ marginBottom: '20px' }}>{currentPattern.name}</h3>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>
            Look at the pattern and choose what comes next:
          </p>
          
          {feedback && (
            <div style={{
              background: feedback.includes('Perfect') ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 193, 7, 0.3)',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `2px solid ${feedback.includes('Perfect') ? 'rgba(40, 167, 69, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`
            }}>
              {feedback}
            </div>
          )}
          
          
          {/* Pattern Display */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              fontSize: '48px',
              marginBottom: '10px'
            }}>
              {currentPattern.sequence.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
              <span style={{ 
                fontSize: '36px', 
                color: 'rgba(255,255,255,0.7)',
                border: '3px dashed rgba(255,255,255,0.5)',
                borderRadius: '8px',
                padding: '5px 15px',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                ?
              </span>
            </div>
          </div>
          
          {/* Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            maxWidth: '300px',
            margin: '0 auto 20px'
          }}>
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => checkAnswer(option)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '48px',
                  padding: '20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Hint Button */}
          <button
            onClick={getHint}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💡 Get Hint
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}