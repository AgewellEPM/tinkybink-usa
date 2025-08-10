'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface SentenceTemplate {
  category: string;
  templates: {
    text: string;
    blanks: string[];
    options: { [key: string]: string[] };
  }[];
}

export function SayTheSentence({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const sentenceTemplates: SentenceTemplate[] = [
    {
      category: 'Daily Activities',
      templates: [
        {
          text: 'I want to ___ with my ___',
          blanks: ['action', 'person'],
          options: {
            action: ['play', 'eat', 'talk', 'walk', 'read'],
            person: ['mom', 'dad', 'friend', 'brother', 'sister']
          }
        },
        {
          text: 'I need to ___ before ___',
          blanks: ['action1', 'action2'],
          options: {
            action1: ['brush teeth', 'wash hands', 'get dressed', 'eat breakfast'],
            action2: ['school', 'bed', 'dinner', 'playing']
          }
        }
      ]
    },
    {
      category: 'Feelings',
      templates: [
        {
          text: 'I feel ___ when ___',
          blanks: ['emotion', 'situation'],
          options: {
            emotion: ['happy', 'sad', 'excited', 'tired', 'proud'],
            situation: ['playing games', 'going to bed', 'eating ice cream', 'missing someone']
          }
        },
        {
          text: 'When I am ___, I like to ___',
          blanks: ['emotion', 'activity'],
          options: {
            emotion: ['happy', 'sad', 'bored', 'excited'],
            activity: ['sing', 'dance', 'hug someone', 'read a book', 'listen to music']
          }
        }
      ]
    },
    {
      category: 'Food & Eating',
      templates: [
        {
          text: 'For ___, I want ___',
          blanks: ['meal', 'food'],
          options: {
            meal: ['breakfast', 'lunch', 'dinner', 'snack'],
            food: ['pizza', 'sandwich', 'apple', 'cookies', 'pasta']
          }
        },
        {
          text: 'My favorite ___ is ___',
          blanks: ['type', 'food'],
          options: {
            type: ['fruit', 'vegetable', 'drink', 'dessert'],
            food: ['apple', 'carrot', 'juice', 'ice cream', 'banana', 'broccoli', 'milk', 'cake']
          }
        }
      ]
    },
    {
      category: 'Places & Activities',
      templates: [
        {
          text: 'I want to go to the ___ to ___',
          blanks: ['place', 'activity'],
          options: {
            place: ['park', 'store', 'school', 'library', 'beach'],
            activity: ['play', 'buy something', 'learn', 'read', 'swim']
          }
        },
        {
          text: 'At ___, I like to ___',
          blanks: ['place', 'activity'],
          options: {
            place: ['home', 'school', 'park', 'grandma\'s house'],
            activity: ['play games', 'draw pictures', 'swing', 'eat cookies', 'watch TV']
          }
        }
      ]
    }
  ];
  
  const [currentCategory, setCurrentCategory] = useState<SentenceTemplate>(sentenceTemplates[0]);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [selectedWords, setSelectedWords] = useState<{ [key: string]: string }>({});
  const [completedSentence, setCompletedSentence] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const startNewSentence = () => {
    const randomTemplate = currentCategory.templates[Math.floor(Math.random() * currentCategory.templates.length)];
    setCurrentTemplate(randomTemplate);
    setSelectedWords({});
    setCompletedSentence('');
    setIsComplete(false);
    // Don't reset streak here - only reset on wrong answers (not applicable for this game)
  };

  // Initialize game
  useState(() => {
    startNewSentence();
  });

  const selectWord = (blankType: string, word: string) => {
    const newSelectedWords = { ...selectedWords, [blankType]: word };
    setSelectedWords(newSelectedWords);
    
    // Check if all blanks are filled
    const allBlanksFilled = currentTemplate.blanks.every((blank: string) => newSelectedWords[blank]);
    
    if (allBlanksFilled) {
      // Build complete sentence
      let sentence = currentTemplate.text;
      currentTemplate.blanks.forEach((blank: string) => {
        sentence = sentence.replace('___', newSelectedWords[blank]);
      });
      setCompletedSentence(sentence);
      setIsComplete(true);
      
      // Update scoring
      const newRounds = rounds + 1;
      const newScore = score + 1;
      const newStreak = streak + 1;
      setRounds(newRounds);
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
    }
  };

  const saySentence = () => {
    if (completedSentence) {
      speak(completedSentence);
    }
  };

  const switchCategory = (newCategory: SentenceTemplate) => {
    setCurrentCategory(newCategory);
    setTimeout(() => {
      startNewSentence();
    }, 100);
  };

  const renderSentenceWithBlanks = () => {
    if (!currentTemplate) return '';
    
    let sentence = currentTemplate.text;
    currentTemplate.blanks.forEach((blank: string, index: number) => {
      const selectedWord = selectedWords[blank];
      const replacement = selectedWord ? 
        `<span style="background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 4px; font-weight: bold;">${selectedWord}</span>` : 
        `<span style="border: 2px dashed rgba(255,255,255,0.5); padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1);">___</span>`;
      sentence = sentence.replace('___', replacement);
    });
    
    return sentence;
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
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentCategory.category.toUpperCase()}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Category</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>💬 Say the Sentence</h2>
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
          <h3 style={{ marginBottom: '20px' }}>{currentCategory.category}</h3>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>
            Fill in the blanks to complete the sentence:
          </p>
          
          {/* Sentence Display */}
          {currentTemplate && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '25px',
              border: '2px solid rgba(255,255,255,0.2)',
              fontSize: '24px',
              lineHeight: 1.4
            }}>
              <div dangerouslySetInnerHTML={{ __html: renderSentenceWithBlanks() }} />
            </div>
          )}
          
          {/* Word Selection */}
          {currentTemplate && currentTemplate.blanks.map((blank: string, blankIndex: number) => (
            <div key={blankIndex} style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                marginBottom: '10px',
                textTransform: 'capitalize',
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                Choose {blank.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                {currentTemplate.options[blank]?.map((word: string, wordIndex: number) => (
                  <button
                    key={wordIndex}
                    onClick={() => selectWord(blank, word)}
                    style={{
                      background: selectedWords[blank] === word ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      fontSize: '14px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseOut={(e) => e.currentTarget.style.background = selectedWords[blank] === word ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Complete Sentence Display & Actions */}
          {isComplete && (
            <div style={{
              background: 'rgba(40, 167, 69, 0.2)',
              border: '2px solid rgba(40, 167, 69, 0.4)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h4>Your complete sentence:</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                "{completedSentence}"
              </p>
              <button
                onClick={saySentence}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  margin: '5px'
                }}
              >
                🔊 Say It Out Loud
              </button>
            </div>
          )}
          
          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={startNewSentence}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 New Sentence
            </button>
            
            {sentenceTemplates.map((category, index) => (
              <button
                key={index}
                onClick={() => switchCategory(category)}
                style={{
                  background: category.category === currentCategory.category ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {category.category}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}