'use client';

import { useAppStore } from '@/store/app-store';

export function LearningGamesSection() {
  const { setCurrentGame } = useAppStore();

  const startGame = (gameName: string) => {
    console.log(`Starting ${gameName} game!`);
    setCurrentGame(gameName);
    // Close settings to show game
    window.dispatchEvent(new Event('toggleSettings'));
  };

  return (
    <div className="settings-section">
      <h3>🎮 Learning Games & Activities</h3>
      <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #e17055, #fdcb6e)' }}
          onClick={() => startGame('whichOne')}
        >
          🧩 Which One Doesn't Belong?
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
          onClick={() => startGame('matchSame')}
        >
          🎯 Match the Same
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #a29bfe, #fd79a8)' }}
          onClick={() => startGame('firstLetterMatch')}
        >
          🔤 First Letter Match
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #6c5ce7, #74b9ff)' }}
          onClick={() => startGame('sequenceBuilder')}
        >
          📋 Sequence Builder
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
          onClick={() => startGame('whatComesNext')}
        >
          ➡️ What Comes Next?
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #fd79a8, #fdcb6e)' }}
          onClick={() => startGame('matchEmotion')}
        >
          😊 Match the Emotion
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #74b9ff, #0984e3)' }}
          onClick={() => startGame('sayTheSentence')}
        >
          💬 Say the Sentence
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #00cec9, #55a3ff)' }}
          onClick={() => startGame('whatDoYouWear')}
        >
          👔 What Do You Wear?
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)' }}
          onClick={() => startGame('makeSandwich')}
        >
          🥪 Make a Sandwich
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #ff7675, #fd79a8)' }}
          onClick={() => startGame('pickColor')}
        >
          🎨 Pick the Color
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #81ecec, #74b9ff)' }}
          onClick={() => startGame('putAway')}
        >
          📦 Put Away Items
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #55a3ff, #6c5ce7)' }}
          onClick={() => startGame('yesNo')}
        >
          ❓ Yes or No Game
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
          onClick={() => startGame('soundMatch')}
        >
          🔊 Sound Matching
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #fab1a0, #ff7675)' }}
          onClick={() => startGame('whatsMissing')}
        >
          🔍 What's Missing?
        </button>
        <button 
          className="action-btn" 
          style={{ background: 'linear-gradient(135deg, #00b894, #55a3ff)' }}
          onClick={() => startGame('routineBuilder')}
        >
          📅 Daily Routine Builder
        </button>
      </div>
    </div>
  );
}