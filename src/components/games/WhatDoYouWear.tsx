'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface ClothingScenario {
  situation: string;
  emoji: string;
  correctClothes: string[];
  weather?: string;
  activity?: string;
  explanation: string;
}

export function WhatDoYouWear({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const allClothes = [
    '🧥 Winter Coat', '👕 T-shirt', '👖 Jeans', '🩳 Shorts', 
    '👗 Dress', '👠 High Heels', '👟 Sneakers', '🥾 Boots',
    '🧦 Socks', '🧤 Gloves', '🧣 Scarf', '👒 Sun Hat',
    '🩱 Swimsuit', '👙 Bikini', '🩲 Underwear', '👔 Suit',
    '👘 Robe', '🧢 Baseball Cap', '☔ Raincoat', '🩴 Flip Flops',
    '🧢 Winter Hat', '🩰 Ballet Shoes', '👑 Crown', '🥽 Goggles'
  ];
  
  const scenarios: ClothingScenario[] = [
    {
      situation: 'Going to the Beach',
      emoji: '🏖️',
      weather: 'Hot and Sunny',
      activity: 'Swimming and playing in sand',
      correctClothes: ['🩱 Swimsuit', '👒 Sun Hat', '🩴 Flip Flops', '🕶️ Sunglasses'],
      explanation: 'At the beach, you need clothes for swimming and sun protection!'
    },
    {
      situation: 'Snowy Winter Day',
      emoji: '❄️',
      weather: 'Cold and Snowy',
      activity: 'Playing outside in snow',
      correctClothes: ['🧥 Winter Coat', '🧤 Gloves', '🧣 Scarf', '🧢 Winter Hat', '🥾 Boots'],
      explanation: 'In winter, you need warm clothes to stay cozy and dry!'
    },
    {
      situation: 'Going to School',
      emoji: '🏫',
      weather: 'Normal Day',
      activity: 'Learning and playing',
      correctClothes: ['👕 T-shirt', '👖 Jeans', '👟 Sneakers', '🧦 Socks'],
      explanation: 'For school, you need comfortable clothes for learning and playing!'
    },
    {
      situation: 'Rainy Day',
      emoji: '🌧️',
      weather: 'Wet and Rainy',
      activity: 'Staying dry outside',
      correctClothes: ['☔ Raincoat', '🥾 Boots', '👖 Jeans', '🧢 Baseball Cap'],
      explanation: 'When it\'s raining, you need clothes to keep you dry!'
    },
    {
      situation: 'Going to Sleep',
      emoji: '🛏️',
      weather: 'Nighttime',
      activity: 'Sleeping comfortably',
      correctClothes: ['👘 Robe', '🩲 Underwear', '🧦 Socks'],
      explanation: 'For sleeping, you need comfortable, loose clothes!'
    },
    {
      situation: 'Fancy Party',
      emoji: '🎉',
      weather: 'Indoor Event',
      activity: 'Celebrating with friends',
      correctClothes: ['👗 Dress', '👠 High Heels', '👑 Crown'],
      explanation: 'For a party, you wear your nicest, fanciest clothes!'
    },
    {
      situation: 'Playing Sports',
      emoji: '⚽',
      weather: 'Active Day',
      activity: 'Running and exercising',
      correctClothes: ['👕 T-shirt', '🩳 Shorts', '👟 Sneakers', '🧦 Socks'],
      explanation: 'For sports, you need comfortable clothes you can move in!'
    },
    {
      situation: 'Hot Summer Day',
      emoji: '☀️',
      weather: 'Very Hot',
      activity: 'Staying cool outside',
      correctClothes: ['👕 T-shirt', '🩳 Shorts', '👒 Sun Hat', '🩴 Flip Flops'],
      explanation: 'When it\'s hot, you wear light clothes to stay cool!'
    }
  ];
  
  const [currentScenario, setCurrentScenario] = useState<ClothingScenario>(scenarios[0]);
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
  const [availableClothes, setAvailableClothes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const startNewScenario = () => {
    const newScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setCurrentScenario(newScenario);
    setSelectedClothes([]);
    setFeedback('');
    
    // Mix correct clothes with some wrong options
    const wrongOptions = allClothes
      .filter(item => !newScenario.correctClothes.includes(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    
    const allOptions = [...newScenario.correctClothes, ...wrongOptions]
      .sort(() => Math.random() - 0.5);
    
    setAvailableClothes(allOptions);
  };

  // Initialize game
  useState(() => {
    startNewScenario();
  });

  const toggleClothing = (clothing: string) => {
    if (selectedClothes.includes(clothing)) {
      setSelectedClothes(selectedClothes.filter(item => item !== clothing));
    } else {
      setSelectedClothes([...selectedClothes, clothing]);
    }
    setFeedback(''); // Clear feedback when making changes
  };

  const checkOutfit = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    const correctItems = selectedClothes.filter(item => 
      currentScenario.correctClothes.includes(item)
    );
    const wrongItems = selectedClothes.filter(item => 
      !currentScenario.correctClothes.includes(item)
    );
    
    const correctCount = correctItems.length;
    const totalCorrect = currentScenario.correctClothes.length;
    const wrongCount = wrongItems.length;
    
    if (correctCount === totalCorrect && wrongCount === 0) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      setFeedback(`🎉 Perfect outfit! ${currentScenario.explanation}`);
      speak(`Perfect! You chose exactly the right clothes. ${currentScenario.explanation}`);
    } else {
      setStreak(0);
      if (correctCount > wrongCount) {
        setFeedback(`🙂 Good choices! You got ${correctCount} out of ${totalCorrect} correct items. ${wrongCount > 0 ? `But ${wrongCount} items don't quite fit this situation.` : 'Try to find all the right items!'}`);
        speak(`Good job! You're on the right track. ${wrongCount > 0 ? 'But some items don\'t fit this situation.' : 'Keep looking for more items!'}`);
      } else {
        setFeedback(`🤔 Think about what you really need for this situation. ${currentScenario.explanation}`);
        speak('Think carefully about what clothes work best for this situation.');
      }
    }
  };

  const getHint = () => {
    const missingItems = currentScenario.correctClothes.filter(item => 
      !selectedClothes.includes(item)
    );
    
    if (missingItems.length > 0) {
      const randomMissing = missingItems[Math.floor(Math.random() * missingItems.length)];
      setFeedback(`💡 Hint: You might need ${randomMissing} for this situation!`);
      speak(`Hint: You might need ${randomMissing.split(' ')[1]} for this situation!`);
    }
  };

  const showAnswer = () => {
    setSelectedClothes([...currentScenario.correctClothes]);
    setFeedback(`📚 Here's the perfect outfit: ${currentScenario.explanation}`);
    speak(`Here are the perfect clothes for this situation: ${currentScenario.correctClothes.map(item => item.split(' ')[1]).join(', ')}`);
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
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}/{attempts}</div>
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
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedClothes.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Selected</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>👔 What Do You Wear?</h2>
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
          
          {/* Scenario Display */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '20px',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>
              {currentScenario.emoji}
            </div>
            <h3 style={{ marginBottom: '15px' }}>{currentScenario.situation}</h3>
            {currentScenario.weather && (
              <p style={{ marginBottom: '5px', fontStyle: 'italic' }}>
                Weather: {currentScenario.weather}
              </p>
            )}
            {currentScenario.activity && (
              <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
                Activity: {currentScenario.activity}
              </p>
            )}
            <p style={{ fontSize: '16px', opacity: 0.9 }}>
              Choose the best clothes for this situation!
            </p>
          </div>
          
          {feedback && (
            <div style={{
              background: feedback.includes('🎉') ? 'rgba(40, 167, 69, 0.3)' : 
                         feedback.includes('🙂') ? 'rgba(255, 193, 7, 0.3)' : 
                         'rgba(23, 162, 184, 0.3)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: `2px solid ${feedback.includes('🎉') ? 'rgba(40, 167, 69, 0.5)' : 
                                  feedback.includes('🙂') ? 'rgba(255, 193, 7, 0.5)' : 
                                  'rgba(23, 162, 184, 0.5)'}`
            }}>
              {feedback}
            </div>
          )}
          
          {/* Selected Clothes Display */}
          {selectedClothes.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <h4 style={{ marginBottom: '10px' }}>Your Outfit:</h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center'
              }}>
                {selectedClothes.map((item, index) => (
                  <span key={index} style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Clothing Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '25px'
          }}>
            {availableClothes.map((clothing, index) => (
              <button
                key={index}
                onClick={() => toggleClothing(clothing)}
                style={{
                  background: selectedClothes.includes(clothing) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${selectedClothes.includes(clothing) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'}`,
                  color: 'white',
                  fontSize: '12px',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = selectedClothes.includes(clothing) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
              >
                {clothing}
              </button>
            ))}
          </div>
          
          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={checkOutfit}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✅ Check My Outfit
            </button>
            <button
              onClick={getHint}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              💡 Hint
            </button>
            <button
              onClick={showAnswer}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📚 Show Answer
            </button>
            <button
              onClick={startNewScenario}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 New Situation
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}