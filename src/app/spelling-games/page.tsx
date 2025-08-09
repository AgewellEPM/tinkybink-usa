'use client';

import { useState, useEffect } from 'react';
import { comprehensiveSpellingGamesService } from '@/services/comprehensive-spelling-games';

export default function SpellingGamesPage() {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [gameStats, setGameStats] = useState({
    score: 0,
    wordsAttempted: 0,
    wordsCorrect: 0,
    currentStreak: 0,
    totalTime: 0
  });
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSpellingAnalytics();
  }, []);

  const loadSpellingAnalytics = async () => {
    try {
      const analytics = await comprehensiveSpellingGamesService.getSpellingAnalytics('demo_student');
      console.log('Spelling Analytics:', analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const startGame = async (gameType: string) => {
    setIsLoading(true);
    try {
      const gameSession = await comprehensiveSpellingGamesService.startSpellingGame(
        'demo_student',
        gameType as any,
        { difficulty: 2, word_count: 10 }
      );
      
      setActiveGame(gameSession);
      setCurrentChallenge(gameSession.initial_challenge);
      setGameStats(prev => ({ ...prev, score: 0, wordsAttempted: 0, wordsCorrect: 0 }));
      
      // Load first game-specific challenge
      if (gameType === 'spelling_bee') {
        const beeChallenge = await comprehensiveSpellingGamesService.playSpellingBeeGame(gameSession.session_id);
        setCurrentChallenge({ ...gameSession.initial_challenge, ...beeChallenge });
      } else if (gameType === 'word_scramble') {
        const scrambleChallenge = await comprehensiveSpellingGamesService.playWordScrambleGame(gameSession.session_id);
        setCurrentChallenge({ ...gameSession.initial_challenge, ...scrambleChallenge });
      } else if (gameType === 'missing_letters') {
        const missingChallenge = await comprehensiveSpellingGamesService.playMissingLettersGame(gameSession.session_id);
        setCurrentChallenge({ ...gameSession.initial_challenge, ...missingChallenge });
      }
      
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTileClick = (tileId: string) => {
    setSelectedTiles(prev => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else {
        return [...prev, tileId];
      }
    });
  };

  const submitSpelling = async () => {
    if (!activeGame || selectedTiles.length === 0) return;
    
    setIsLoading(true);
    try {
      const result = await comprehensiveSpellingGamesService.processSpellingAnswer(
        activeGame.session_id,
        selectedTiles,
        'tiles'
      );
      
      setFeedbackData(result);
      setShowFeedback(true);
      
      // Update game stats
      setGameStats(prev => ({
        ...prev,
        score: prev.score + result.score_earned,
        wordsAttempted: prev.wordsAttempted + 1,
        wordsCorrect: result.correct ? prev.wordsCorrect + 1 : prev.wordsCorrect,
        currentStreak: result.correct ? prev.currentStreak + 1 : 0
      }));
      
      // Auto-hide feedback and load next challenge
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedTiles([]);
        if (result.next_challenge) {
          setCurrentChallenge(result.next_challenge);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting spelling:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setActiveGame(null);
    setCurrentChallenge(null);
    setSelectedTiles([]);
    setShowFeedback(false);
    setGameStats({ score: 0, wordsAttempted: 0, wordsCorrect: 0, currentStreak: 0, totalTime: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 All Spelling Games
          </h1>
          <p className="text-lg text-gray-600">
            Master spelling with 12 different interactive games!
          </p>
          
          {/* Game Stats */}
          {activeGame && (
            <div className="flex justify-center space-x-6 mt-4">
              <StatCard label="Score" value={gameStats.score} color="blue" />
              <StatCard label="Correct" value={`${gameStats.wordsCorrect}/${gameStats.wordsAttempted}`} color="green" />
              <StatCard label="Streak" value={gameStats.currentStreak} color="purple" />
            </div>
          )}
        </div>

        {!activeGame ? (
          // Game Selection Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <GameCard
              title="🏆 Spelling Bee"
              description="Classic spelling competition"
              difficulty="Easy to Hard"
              timeEstimate="15 min"
              onClick={() => startGame('spelling_bee')}
              color="yellow"
            />
            
            <GameCard
              title="🔀 Word Scramble"
              description="Unscramble letters to form words"
              difficulty="Easy to Medium"
              timeEstimate="10 min"
              onClick={() => startGame('word_scramble')}
              color="blue"
            />
            
            <GameCard
              title="🕳️ Missing Letters"
              description="Fill in the blanks to complete words"
              difficulty="Easy to Medium"
              timeEstimate="8 min"
              onClick={() => startGame('missing_letters')}
              color="green"
            />
            
            <GameCard
              title="🎨 Pattern Match"
              description="Learn spelling patterns"
              difficulty="Medium to Hard"
              timeEstimate="12 min"
              onClick={() => startGame('pattern_match')}
              color="purple"
            />
            
            <GameCard
              title="🧠 Memory Spell"
              description="Study then spell from memory"
              difficulty="Medium to Hard"
              timeEstimate="10 min"
              onClick={() => startGame('memory_spell')}
              color="indigo"
            />
            
            <GameCard
              title="⚡ Speed Spelling"
              description="Fast-paced spelling race"
              difficulty="Medium to Hard"
              timeEstimate="5 min"
              onClick={() => startGame('speed_spell')}
              color="red"
            />
            
            <GameCard
              title="🏰 Spelling Adventure"
              description="Story-based spelling quests"
              difficulty="Easy to Medium"
              timeEstimate="20 min"
              onClick={() => startGame('creative_spell')}
              color="teal"
            />
            
            <GameCard
              title="💨 Tile Drop"
              description="Tetris-style spelling game"
              difficulty="Hard"
              timeEstimate="8 min"
              onClick={() => startGame('tile_drop')}
              color="orange"
            />
            
            <GameCard
              title="🎪 Spell Race"
              description="Multiplayer spelling competition"
              difficulty="Medium"
              timeEstimate="7 min"
              onClick={() => startGame('spell_race')}
              color="pink"
            />
            
            <GameCard
              title="🎵 Rhyme Spell"
              description="Spell words that rhyme"
              difficulty="Easy to Medium"
              timeEstimate="10 min"
              onClick={() => startGame('rhyme_spell')}
              color="cyan"
            />
            
            <GameCard
              title="📚 Story Spell"
              description="Complete stories by spelling words"
              difficulty="Medium"
              timeEstimate="15 min"
              onClick={() => startGame('story_spell')}
              color="amber"
            />
            
            <GameCard
              title="🏗️ Word Builder"
              description="Build words from letter components"
              difficulty="Easy to Hard"
              timeEstimate="12 min"
              onClick={() => startGame('word_builder')}
              color="emerald"
            />
          </div>
        ) : (
          // Active Game Interface
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{activeGame?.game?.game_name || 'Spelling Game'}</h2>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to Games
              </button>
            </div>
            
            {/* Game Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{activeGame?.game_instructions}</p>
            </div>
            
            {/* Spelling Bee Interface */}
            {activeGame?.game?.game_type === 'spelling_bee' && currentChallenge?.current_word && (
              <SpellingBeeInterface
                challenge={currentChallenge}
                selectedTiles={selectedTiles}
                onTileClick={handleTileClick}
                onSubmit={submitSpelling}
                isLoading={isLoading}
              />
            )}
            
            {/* Word Scramble Interface */}
            {activeGame?.game?.game_type === 'word_scramble' && currentChallenge?.scrambled_tiles && (
              <WordScrambleInterface
                challenge={currentChallenge}
                selectedTiles={selectedTiles}
                onTileClick={handleTileClick}
                onSubmit={submitSpelling}
                isLoading={isLoading}
              />
            )}
            
            {/* Missing Letters Interface */}
            {activeGame?.game?.game_type === 'missing_letters' && currentChallenge?.word_template && (
              <MissingLettersInterface
                challenge={currentChallenge}
                selectedTiles={selectedTiles}
                onTileClick={handleTileClick}
                onSubmit={submitSpelling}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && feedbackData && (
          <FeedbackModal
            feedback={feedbackData}
            onClose={() => setShowFeedback(false)}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading spelling challenge...</p>
            </div>
          </div>
        )}

        {/* Instructions Panel */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🎮 How to Play</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="text-purple-600 font-bold">1.</span>
                <span>Choose from 12 different spelling games</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600 font-bold">2.</span>
                <span>Use tiles to spell words correctly</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600 font-bold">3.</span>
                <span>Earn points and build spelling streaks</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600 font-bold">4.</span>
                <span>Get feedback and hints to improve</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🏆 Learning Benefits</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="text-green-600">📝</span>
                <span>Master spelling patterns and rules</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600">🧠</span>
                <span>Improve visual and auditory memory</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600">⚡</span>
                <span>Build spelling fluency and speed</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600">🎯</span>
                <span>Develop confidence in writing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Card Component
function GameCard({ title, description, difficulty, timeEstimate, onClick, color }: {
  title: string;
  description: string;
  difficulty: string;
  timeEstimate: string;
  onClick: () => void;
  color: string;
}) {
  const colorClasses = {
    yellow: 'from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600',
    blue: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    green: 'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
    purple: 'from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600',
    indigo: 'from-indigo-400 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600',
    red: 'from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
    teal: 'from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600',
    orange: 'from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600',
    pink: 'from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600',
    cyan: 'from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600',
    amber: 'from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600',
    emerald: 'from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600'
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left h-full`}
    >
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90 mb-3">{description}</p>
      <div className="flex justify-between text-xs opacity-80">
        <span>{difficulty}</span>
        <span>{timeEstimate}</span>
      </div>
    </button>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// Spelling Bee Interface
function SpellingBeeInterface({ challenge, selectedTiles, onTileClick, onSubmit, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          Round {challenge.round_number} - Difficulty {challenge.difficulty_indicator}
        </h3>
        <div className="bg-yellow-100 p-6 rounded-lg">
          <p className="text-lg mb-2">Listen and spell this word:</p>
          <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 text-xl font-bold">
            🔊 {challenge.current_word.word.toUpperCase()}
          </button>
          <p className="text-sm text-gray-600 mt-2">{challenge.definition_clue}</p>
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Your Spelling:</h4>
        <div className="flex justify-center gap-2 min-h-[60px] mb-6">
          {selectedTiles.map((tileId: any, index: any) => (
            <div key={index} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
              {tileId.split('_')[1]?.toUpperCase()}
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-3 mb-6">
          {'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => (
            <button
              key={letter}
              onClick={() => onTileClick(`tile_${letter}`)}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                selectedTiles.includes(`tile_${letter}`)
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {letter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => selectedTiles.length > 0 && selectedTiles.splice(-1)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          ⌫ Delete
        </button>
        <button
          onClick={onSubmit}
          disabled={selectedTiles.length === 0 || isLoading}
          className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          ✓ Submit Spelling
        </button>
      </div>
    </div>
  );
}

// Word Scramble Interface
function WordScrambleInterface({ challenge, selectedTiles, onTileClick, onSubmit, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-4">Unscramble the Letters!</h3>
        <p className="text-gray-600 mb-2">{challenge.category_hint}</p>
        <p className="text-sm text-gray-500">Target length: {challenge.target_word_length} letters</p>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Scrambled Letters:</h4>
        <div className="flex justify-center gap-3 mb-6">
          {challenge.scrambled_tiles?.map((tile: any) => (
            <button
              key={tile.tile_id}
              onClick={() => onTileClick(tile.tile_id)}
              className={`px-4 py-3 rounded-lg font-bold text-lg transition-all ${
                selectedTiles.includes(tile.tile_id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200'
              }`}
            >
              {tile.display_text}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Your Word:</h4>
        <div className="flex justify-center gap-2 min-h-[60px] mb-6">
          {selectedTiles.map((tileId: string, index: number) => {
            const tile = challenge.scrambled_tiles?.find((t: any) => t.tile_id === tileId);
            return tile ? (
              <div key={index} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {tile.display_text}
              </div>
            ) : null;
          })}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSelectedTiles([])}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          🔄 Reset
        </button>
        <button
          onClick={onSubmit}
          disabled={selectedTiles.length === 0 || isLoading}
          className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          ✓ Check Word
        </button>
      </div>
    </div>
  );
}

// Missing Letters Interface
function MissingLettersInterface({ challenge, selectedTiles, onTileClick, onSubmit, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-4">Fill in the Missing Letters!</h3>
        <p className="text-gray-600 mb-2">{challenge.word_definition}</p>
        <p className="text-sm text-gray-500">Missing: {challenge.missing_count} letters</p>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Complete the Word:</h4>
        <div className="flex justify-center gap-2 mb-6">
          {challenge.word_template?.map((slot: any) => (
            <div
              key={slot.position}
              className={`px-4 py-3 rounded-lg font-bold text-lg border-2 ${
                slot.is_missing
                  ? 'border-dashed border-gray-400 bg-gray-50'
                  : 'border-solid border-green-500 bg-green-100'
              }`}
            >
              {slot.letter?.toUpperCase() || '_'}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Available Letters:</h4>
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {challenge.available_letter_tiles?.map((tile: any) => (
            <button
              key={tile.tile_id}
              onClick={() => onTileClick(tile.tile_id)}
              className={`px-4 py-3 rounded-lg font-bold text-lg transition-all ${
                selectedTiles.includes(tile.tile_id)
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 hover:bg-green-200'
              }`}
            >
              {tile.display_text}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onSubmit}
          disabled={selectedTiles.length !== challenge.missing_count || isLoading}
          className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          ✓ Complete Word
        </button>
      </div>
    </div>
  );
}

// Feedback Modal
function FeedbackModal({ feedback, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">
            {feedback.correct ? '🎉' : '💪'}
          </div>
          <h3 className="text-xl font-bold mb-2">
            {feedback.correct ? 'Excellent!' : 'Keep Trying!'}
          </h3>
          <p className="text-gray-600 mb-4">{feedback.feedback.message}</p>
          
          {!feedback.correct && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Correct spelling:</strong> {feedback.feedback.correct_spelling}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {feedback.feedback.learning_tip}
              </p>
            </div>
          )}
          
          {feedback.bonuses_applied.length > 0 && (
            <div className="mb-4">
              {feedback.bonuses_applied.map((bonus: string, index: number) => (
                <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2">
                  {bonus}
                </span>
              ))}
            </div>
          )}
          
          <div className="text-2xl font-bold text-green-600 mb-4">
            +{feedback.score_earned} points!
          </div>
        </div>
      </div>
    </div>
  );
}