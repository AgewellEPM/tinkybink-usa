'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { GameCard } from './GameCard';

interface WordGroup {
  [key: string]: string[];
}

export function FirstLetterMatch({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const wordGroups: WordGroup = {
    A: ['🍎 Apple', '✈️ Airplane', '🐊 Alligator', '🎨 Art', '🔥 Arrow', '🅰️ Ant', '👼 Angel', '⚓ Anchor'],
    B: ['🍌 Banana', '🏀 Ball', '🐻 Bear', '📚 Book', '🦋 Butterfly', '🚌 Bus', '🎈 Balloon', '🧸 Bear'],
    C: ['🐱 Cat', '🚗 Car', '🍪 Cookie', '👑 Crown', '🐄 Cow', '🌙 Crescent', '🧁 Cupcake', '☁️ Cloud'],
    D: ['🐶 Dog', '🦆 Duck', '🍩 Donut', '🥁 Drum', '🦕 Dinosaur', '🚪 Door', '💎 Diamond', '🌼 Daisy'],
    E: ['🐘 Elephant', '👁️ Eye', '🥚 Egg', '👂 Ear', '🦅 Eagle', '🌍 Earth', '📧 Email', '🔌 Electric'],
    F: ['🐸 Frog', '🐟 Fish', '🌸 Flower', '🔥 Fire', '🦊 Fox', '🍟 Fries', '👨‍🚒 Fireman', '🏴 Flag'],
    G: ['🦒 Giraffe', '🍇 Grapes', '🎁 Gift', '👻 Ghost', '🌱 Grass', '🍏 Green Apple', '🎸 Guitar', '🐐 Goat'],
    H: ['🏠 House', '❤️ Heart', '🐎 Horse', '🍯 Honey', '🎩 Hat', '🔨 Hammer', '🦔 Hedgehog', '🚁 Helicopter'],
    I: ['🍦 Ice Cream', '🏝️ Island', '🦎 Iguana', '💡 Idea', '🧊 Ice', '📱 iPhone', '🚫 Invalid', '🌈 Iris'],
    J: ['🃏 Joker', '🧃 Juice', '👖 Jeans', '🤹 Juggle', '💎 Jewel', '🕕 January', '🎷 Jazz', '🦘 Jump'],
    K: ['🔑 Key', '👑 King', '🥝 Kiwi', '🪁 Kite', '🐨 Koala', '🔪 Knife', '⌨️ Keyboard', '🦘 Kangaroo'],
    L: ['🦁 Lion', '🍋 Lemon', '💡 Light', '🐞 Ladybug', '🪜 Ladder', '🦎 Lizard', '💕 Love', '🌿 Leaf'],
    M: ['🐭 Mouse', '🌙 Moon', '🍄 Mushroom', '🐒 Monkey', '🥛 Milk', '🗺️ Map', '🎭 Mask', '🏔️ Mountain'],
    N: ['🌙 Night', '👃 Nose', '🥜 Nuts', '📰 News', '🪆 Nesting', '🔢 Numbers', '🏥 Nurse', '🍜 Noodles'],
    O: ['🐙 Octopus', '🍊 Orange', '🦉 Owl', '📂 Open', '🌊 Ocean', '🥥 Olive', '🔓 Open Lock', '🚢 Oil'],
    P: ['🐧 Penguin', '🍕 Pizza', '🐷 Pig', '🌸 Pink', '🍑 Peach', '🎹 Piano', '📞 Phone', '🥞 Pancake'],
    Q: ['👸 Queen', '❓ Question', '🦆 Quack', '🪶 Quill', '⚡ Quick', '🔇 Quiet', '💎 Quartz', '📊 Quota'],
    R: ['🌈 Rainbow', '🐭 Rat', '🌹 Rose', '🚀 Rocket', '🍚 Rice', '☔ Rain', '📻 Radio', '🦏 Rhino'],
    S: ['☀️ Sun', '⭐ Star', '🐍 Snake', '🍓 Strawberry', '🦢 Swan', '🏊 Swimming', '✂️ Scissors', '🧪 Science'],
    T: ['🐅 Tiger', '🌳 Tree', '🚂 Train', '🎾 Tennis', '🦃 Turkey', '📺 TV', '🏆 Trophy', '🍅 Tomato'],
    U: ['☂️ Umbrella', '🦄 Unicorn', '⬆️ Up', '🇺🇸 USA', '🔓 Unlock', '🎓 University', '🔊 Unique', '🔄 Update'],
    V: ['🎻 Violin', '🌋 Volcano', '🚐 Van', '🥬 Vegetable', '💜 Violet', '🏐 Volleyball', '🎮 Video Game', '🍷 Vine'],
    W: ['🐋 Whale', '🍉 Watermelon', '⌚ Watch', '🌊 Water', '🪟 Window', '🐺 Wolf', '❄️ Winter', '🍷 Wine'],
    X: ['❌ X-mark', '🎄 Xmas', '📱 Xbox', '💀 X-ray', '🔇 X-out', '⚔️ X-sword', '🎯 X-target', '🧬 X-gene'],
    Y: ['💛 Yellow', '🧘 Yoga', '🍠 Yam', '🛥️ Yacht', '🥱 Yawn', '📅 Year', '🧶 Yarn', '⚡ Yelp'],
    Z: ['🦓 Zebra', '💤 Zzz', '🔍 Zoom', '🎪 Zoo', '⚡ Zap', '0️⃣ Zero', '🏃 Zip', '🧟 Zombie']
  };
  
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [targetWord, setTargetWord] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showWords, setShowWords] = useState(true);

  const getSimilarSoundingLetters = (letter: string): string[] => {
    const similarGroups: { [key: string]: string[] } = {
      'B': ['P', 'D'],
      'P': ['B', 'T'],
      'D': ['B', 'T'],
      'T': ['D', 'P'],
      'C': ['K', 'G'],
      'K': ['C', 'G'],
      'G': ['C', 'K'],
      'F': ['V'],
      'V': ['F'],
      'S': ['Z'],
      'Z': ['S'],
      'M': ['N'],
      'N': ['M']
    };
    
    return similarGroups[letter] || [];
  };

  const startNewRound = () => {
    const currentWords = wordGroups[currentLetter];
    const newTarget = currentWords[Math.floor(Math.random() * currentWords.length)];
    
    // Adjust difficulty based on setting
    const numWrongOptions = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;
    const wrongOptions: string[] = [];
    const otherLetters = Object.keys(wordGroups).filter(l => l !== currentLetter);
    
    // For hard difficulty, include some tricky options (words that start with similar sounds)
    if (difficulty === 'hard') {
      const similarLetters = getSimilarSoundingLetters(currentLetter);
      const similarWords: string[] = [];
      
      similarLetters.forEach(letter => {
        if (wordGroups[letter]) {
          similarWords.push(...wordGroups[letter]);
        }
      });
      
      // Add some similar-sounding words first
      while (wrongOptions.length < Math.min(2, numWrongOptions) && similarWords.length > 0) {
        const randomWord = similarWords[Math.floor(Math.random() * similarWords.length)];
        if (!wrongOptions.includes(randomWord) && randomWord !== newTarget) {
          wrongOptions.push(randomWord);
        }
        similarWords.splice(similarWords.indexOf(randomWord), 1);
      }
    }
    
    // Fill remaining slots with random words
    while (wrongOptions.length < numWrongOptions) {
      const randomLetter = otherLetters[Math.floor(Math.random() * otherLetters.length)];
      const randomWord = wordGroups[randomLetter][Math.floor(Math.random() * wordGroups[randomLetter].length)];
      if (!wrongOptions.includes(randomWord)) {
        wrongOptions.push(randomWord);
      }
    }
    
    const allOptions = [newTarget, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    setTargetWord(newTarget);
    setOptions(allOptions);
  };

  // Initialize game
  useEffect(() => {
    startNewRound();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAnswer = (selected: string) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    
    if (selected === targetWord) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      
      // Extract the actual word for speech feedback
      const wordName = targetWord.split(' ')[1] || 'that';
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        if (newStreak >= 5) {
          speak(`Amazing! ${newStreak} in a row! Yes, ${wordName} starts with ${currentLetter}!`);
        } else {
          speak(`Great job! Yes, ${wordName} starts with ${currentLetter}`);
        }
      } else {
        speak(`Great job! Yes, ${wordName} starts with ${currentLetter}`);
      }
    } else {
      setStreak(0);
      if (showWords) {
        speak('Not quite! Look for the word that starts with ' + currentLetter);
      } else {
        speak('Not quite! Look for the picture that starts with ' + currentLetter);
      }
    }
    
    setTimeout(() => {
      startNewRound();
    }, 1500);
  };

  const switchLetter = (letter: string) => {
    setCurrentLetter(letter);
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
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>🏆{bestStreak}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Best</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: difficulty === 'easy' ? '#4caf50' : difficulty === 'medium' ? '#ff9800' : '#f44336' }}>
                {difficulty.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Level</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🔤 First Letter Match</h2>
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
        
        <div style={{ 
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
        {/* Big Letter Display */}
        <div style={{ 
          fontSize: '96px', 
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '30px 50px',
          borderRadius: '20px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'inline-block',
          marginTop: '20px'
        }}>
          {currentLetter}
        </div>
          
        <p style={{ 
          fontSize: '20px',
          fontWeight: '500',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          margin: '10px 0 20px'
        }}>
          {showWords 
            ? `Which word starts with the letter "${currentLetter}"?`
            : `Which picture starts with the letter "${currentLetter}"?`}
        </p>
        
        {/* Answer Options using GameCard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: showWords ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '16px',
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto'
        }}>
          {options.map((option, index) => {
            const displayText = showWords ? option : option.split(' ')[0];
            return (
              <GameCard
                key={index}
                onClick={() => checkAnswer(option)}
                number={index + 1}
                size={showWords ? 'medium' : 'large'}
                gradient="linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)"
              >
                <span style={{ fontSize: showWords ? '18px' : '48px' }}>
                  {displayText}
                </span>
              </GameCard>
            );
          })}
        </div>
          
        {/* Controls Section */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          marginTop: '20px',
          maxWidth: '600px',
          width: '100%'
        }}>
          {/* Difficulty Selector */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              marginBottom: '12px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: 0.8
            }}>
              Difficulty Level
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {(['easy', 'medium', 'hard'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => {
                    setDifficulty(level);
                    setTimeout(startNewRound, 100);
                  }}
                  style={{
                    background: difficulty === level 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))'
                      : 'rgba(255,255,255,0.05)',
                    border: difficulty === level
                      ? '2px solid rgba(255,255,255,0.4)'
                      : '2px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    minWidth: '120px'
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                    {level === 'easy' && '3 choices'}
                    {level === 'medium' && '4 choices'}
                    {level === 'hard' && '6 choices'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Word Display Toggle */}
          <button
            onClick={() => setShowWords(!showWords)}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              marginBottom: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>{showWords ? '🔤' : '🎨'}</span>
            <span>{showWords ? 'Switch to Emoji Only' : 'Show Words with Emojis'}</span>
          </button>
          <div style={{
            fontSize: '11px',
            opacity: 0.6,
            textAlign: 'center'
          }}>
            {showWords ? 'Showing words with emojis' : 'Emoji only mode - great for visual learners!'}
          </div>
        </div>
          
        {/* Letter Selector */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          maxWidth: '700px',
          width: '100%'
        }}>
          <div style={{ 
            marginBottom: '16px', 
            fontSize: '14px', 
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            opacity: 0.8,
            textAlign: 'center'
          }}>
            Select Letter to Practice
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '8px',
            marginBottom: '12px'
          }}>
            {Object.keys(wordGroups).map(letter => (
              <button
                key={letter}
                onClick={() => switchLetter(letter)}
                style={{
                  background: letter === currentLetter 
                    ? 'linear-gradient(135deg, #a29bfe, #6c5ce7)' 
                    : 'rgba(255,255,255,0.05)',
                  border: letter === currentLetter 
                    ? '2px solid #a29bfe' 
                    : '2px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: letter === currentLetter 
                    ? '0 6px 20px rgba(162, 155, 254, 0.4)' 
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  transform: letter === currentLetter ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseOver={(e) => {
                  if (letter !== currentLetter) {
                    e.currentTarget.style.background = 'rgba(162, 155, 254, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseOut={(e) => {
                  if (letter !== currentLetter) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}