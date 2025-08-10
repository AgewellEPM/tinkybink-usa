'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface EmotionData {
  emoji: string;
  name: string;
  description: string;
  situations: string[];
}

export function MatchEmotion({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const emotions: EmotionData[] = [
    {
      emoji: '😊',
      name: 'Happy',
      description: 'feeling joyful and cheerful',
      situations: ['🎂 At a birthday party', '🎁 Getting a present', '🌞 Playing outside', '🍦 Eating ice cream']
    },
    {
      emoji: '😢',
      name: 'Sad',
      description: 'feeling down or unhappy',
      situations: ['🌧️ When it\'s raining inside', '💔 Missing a friend', '🚫 Can\'t play favorite game', '😪 Feeling lonely']
    },
    {
      emoji: '😠',
      name: 'Angry',
      description: 'feeling mad or frustrated',
      situations: ['🚫 Someone took your toy', '⏰ Having to stop playing', '🍽️ Don\'t like the food', '📵 Tablet battery died']
    },
    {
      emoji: '😨',
      name: 'Scared',
      description: 'feeling afraid or worried',
      situations: ['🌩️ During a thunderstorm', '🏥 Going to the doctor', '🌙 Sleeping in the dark', '🐕 Seeing a big dog']
    },
    {
      emoji: '😴',
      name: 'Tired',
      description: 'feeling sleepy or exhausted',
      situations: ['⏰ Very early morning', '🏃 After running around', '📚 After a long day', '🛏️ Ready for bed']
    },
    {
      emoji: '🤢',
      name: 'Sick',
      description: 'not feeling well',
      situations: ['🤒 Having a fever', '🤧 Having a cold', '😵 Feeling dizzy', '🍽️ Tummy hurts after eating']
    },
    {
      emoji: '😤',
      name: 'Frustrated',
      description: 'feeling annoyed when things don\'t work',
      situations: ['🧩 Puzzle piece won\'t fit', '👕 Can\'t button shirt', '📱 Game keeps crashing', '🔒 Door is stuck']
    },
    {
      emoji: '🥰',
      name: 'Loved',
      description: 'feeling cared for and special',
      situations: ['🤗 Getting hugs from family', '💌 Receiving a nice note', '🏆 Being praised for good work', '👨‍👩‍👧‍👦 Family time together']
    }
  ];
  
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData>(emotions[0]);
  const [currentSituation, setCurrentSituation] = useState<string>('');
  const [gameMode, setGameMode] = useState<'situation-to-emotion' | 'emotion-to-situation'>('situation-to-emotion');
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const startNewRound = () => {
    const newEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const randomSituation = newEmotion.situations[Math.floor(Math.random() * newEmotion.situations.length)];
    
    setCurrentEmotion(newEmotion);
    setCurrentSituation(randomSituation);
    setFeedback('');
    
    if (gameMode === 'situation-to-emotion') {
      // Show situation, pick emotion
      const wrongEmotions = emotions
        .filter(e => e.name !== newEmotion.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.emoji + ' ' + e.name);
      
      const allOptions = [
        newEmotion.emoji + ' ' + newEmotion.name,
        ...wrongEmotions
      ].sort(() => Math.random() - 0.5);
      
      setOptions(allOptions);
      setCorrectAnswer(newEmotion.emoji + ' ' + newEmotion.name);
    } else {
      // Show emotion, pick situation
      const wrongSituations = emotions
        .filter(e => e.name !== newEmotion.name)
        .flatMap(e => e.situations)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const allOptions = [
        randomSituation,
        ...wrongSituations
      ].sort(() => Math.random() - 0.5);
      
      setOptions(allOptions);
      setCorrectAnswer(randomSituation);
    }
  };

  // Initialize game
  useState(() => {
    startNewRound();
  });

  const checkAnswer = (selected: string) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (selected === correctAnswer) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      setFeedback('Perfect match! You understand emotions well!');
      speak('Great job! You matched the emotion perfectly!');
    } else {
      setStreak(0);
      setFeedback('Not quite right. Think about how you would feel in that situation.');
      speak('Try again! Think about the feeling that matches.');
    }
    
    setTimeout(() => {
      startNewRound();
    }, 2500);
  };

  const switchMode = () => {
    const newMode = gameMode === 'situation-to-emotion' ? 'emotion-to-situation' : 'situation-to-emotion';
    setGameMode(newMode);
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
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{gameMode === 'situation-to-emotion' ? 'SITUATION' : 'EMOTION'}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Mode</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>😊 Match the Emotion</h2>
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
          {feedback && (
            <div style={{
              background: feedback.includes('Perfect') ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `2px solid ${feedback.includes('Perfect') ? 'rgba(40, 167, 69, 0.5)' : 'rgba(220, 53, 69, 0.5)'}`
            }}>
              {feedback}
            </div>
          )}
          
          
          {/* Question Display */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '25px',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {gameMode === 'situation-to-emotion' ? (
              <>
                <h3 style={{ marginBottom: '15px' }}>How would you feel in this situation?</h3>
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '10px'
                }}>
                  {currentSituation}
                </div>
                <p style={{ fontSize: '16px', fontStyle: 'italic', opacity: 0.8 }}>
                  Choose the emotion that matches this situation
                </p>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '15px' }}>When do you feel this way?</h3>
                <div style={{ 
                  fontSize: '64px', 
                  marginBottom: '10px'
                }}>
                  {currentEmotion.emoji}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  {currentEmotion.name}
                </div>
                <p style={{ fontSize: '16px', fontStyle: 'italic', opacity: 0.8 }}>
                  Choose a situation that makes you feel {currentEmotion.name.toLowerCase()}
                </p>
              </>
            )}
          </div>
          
          {/* Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
            maxWidth: '500px',
            margin: '0 auto 25px'
          }}>
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => checkAnswer(option)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '16px',
                  padding: '15px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Mode Switch */}
          <button
            onClick={switchMode}
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
            🔄 Switch Mode: {gameMode === 'situation-to-emotion' ? 'Situation → Emotion' : 'Emotion → Situation'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}