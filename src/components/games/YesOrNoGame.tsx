'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Question {
  question: string;
  answer: 'yes' | 'no';
  explanation: string;
}

export function YesOrNoGame({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const questions: Question[] = [
    { question: 'Do we eat a pencil? ✏️😋', answer: 'no', explanation: 'No! Pencils are for writing, not eating!' },
    { question: 'Do we eat a banana? 🍌😋', answer: 'yes', explanation: 'Yes! Bananas are delicious and healthy!' },
    { question: 'Can a fish fly? 🐟✈️', answer: 'no', explanation: 'No! Fish swim in water, birds fly in the sky!' },
    { question: 'Do we sleep in a bed? 🛏️😴', answer: 'yes', explanation: 'Yes! Beds are perfect for sleeping!' },
    { question: 'Is ice hot? 🧊🔥', answer: 'no', explanation: 'No! Ice is cold, fire is hot!' },
    { question: 'Do we wear shoes on our feet? 👟🦶', answer: 'yes', explanation: 'Yes! Shoes protect our feet!' }
  ];
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const answerQuestion = (answer: 'yes' | 'no') => {
    const q = questions[currentQuestion];
    const isCorrect = answer === q.answer;
    
    if (isCorrect) {
      setScore(score + 1);
      speak('Correct! ' + q.explanation);
    } else {
      speak('Not quite! ' + q.explanation);
    }
    
    setTimeout(() => {
      if (currentQuestion + 1 >= questions.length) {
        setGameComplete(true);
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 2000);
  };

  const resetYesNoGame = () => {
    setCurrentQuestion(0);
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <h2 style={{ margin: 0, fontSize: '24px' }}>❓ Yes or No Game</h2>
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
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>Final Score: {score}/{questions.length}</p>
            <button 
              onClick={resetYesNoGame}
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

  const q = questions[currentQuestion];

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
          <h2 style={{ margin: 0, fontSize: '24px' }}>❓ Yes or No Game</h2>
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
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>Question {currentQuestion + 1} of {questions.length}</p>
          <p style={{ marginBottom: '24px' }}>Score: {score}/{currentQuestion}</p>
          
          <div style={{
            fontSize: '24px',
            marginBottom: '32px',
            padding: '24px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px'
          }}>
            {q.question}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <button 
              onClick={() => answerQuestion('yes')}
              style={{
                background: 'rgba(34, 197, 94, 0.3)',
                border: '4px solid rgba(34, 197, 94, 0.5)',
                color: 'white',
                fontSize: '24px',
                padding: '20px 40px',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
            >
              ✅ YES
            </button>
            <button 
              onClick={() => answerQuestion('no')}
              style={{
                background: 'rgba(239, 68, 68, 0.3)',
                border: '4px solid rgba(239, 68, 68, 0.5)',
                color: 'white',
                fontSize: '24px',
                padding: '20px 40px',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
            >
              ❌ NO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}