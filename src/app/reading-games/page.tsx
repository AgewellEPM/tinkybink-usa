'use client';

import { useState, useEffect } from 'react';
import { readingSpellingGamesService } from '@/services/reading-spelling-games-service';
import { phonicsTileSystemService } from '@/services/phonics-tile-system';

export default function ReadingGamesPage() {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [phonicsSession, setPhonicksSession] = useState<any>(null);
  const [gameProgress, setGameProgress] = useState({
    score: 0,
    level: 1,
    streakCount: 0
  });
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    initializeReadingGames();
  }, []);

  const initializeReadingGames = async () => {
    try {
      // Start a phonics session
      const session = await phonicsTileSystemService.startPhonicsSession('demo_student');
      setPhonicksSession(session);
      
      // Start first reading game
      const game = await readingSpellingGamesService.startReadingGame('demo_student', 'word_builder');
      setActiveGame(game);
    } catch (error) {
      console.error('Error initializing reading games:', error);
    }
  };

  const handleTileSelect = (tileId: string) => {
    setSelectedTiles(prev => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else {
        return [...prev, tileId];
      }
    });
  };

  const submitAnswer = async () => {
    try {
      if (!activeGame) return;
      
      const result = await readingSpellingGamesService.processGameAnswer(
        activeGame.session_id,
        selectedTiles,
        'current_challenge'
      );
      
      setFeedbackMessage(result.feedback);
      setShowFeedback(true);
      
      if (result.correct) {
        setGameProgress(prev => ({
          ...prev,
          score: prev.score + result.score_earned,
          streakCount: prev.streakCount + 1
        }));
      } else {
        setGameProgress(prev => ({
          ...prev,
          streakCount: 0
        }));
      }
      
      // Clear selection and hide feedback after delay
      setTimeout(() => {
        setSelectedTiles([]);
        setShowFeedback(false);
        if (result.next_challenge) {
          // Load next challenge
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const startWordBuilderGame = async () => {
    try {
      const challenge = await readingSpellingGamesService.playWordBuilderGame(activeGame?.session_id);
      setActiveGame((prev: any) => ({ ...prev, current_challenge: challenge }));
    } catch (error) {
      console.error('Error starting word builder:', error);
    }
  };

  const startPhonicsMatching = async () => {
    try {
      const activity = await phonicsTileSystemService.playLetterSoundMatching(phonicsSession?.session_id);
      setPhonicksSession((prev: any) => ({ ...prev, current_activity: activity }));
    } catch (error) {
      console.error('Error starting phonics matching:', error);
    }
  };

  const startBlendingPractice = async () => {
    try {
      const activity = await phonicsTileSystemService.playBlendingPractice(phonicsSession?.session_id);
      setPhonicksSession((prev: any) => ({ ...prev, current_activity: activity }));
    } catch (error) {
      console.error('Error starting blending practice:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Reading & Spelling Games
          </h1>
          <p className="text-lg text-gray-600">
            Learn to read and spell using our interactive tile system!
          </p>
          
          {/* Progress Display */}
          <div className="flex justify-center space-x-8 mt-4">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-blue-600">{gameProgress.score}</div>
              <div className="text-sm text-gray-500">Points</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">{gameProgress.level}</div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-purple-600">{gameProgress.streakCount}</div>
              <div className="text-sm text-gray-500">Streak</div>
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GameCard
            title="🔤 Word Builder"
            description="Build words using letter tiles"
            onClick={startWordBuilderGame}
            color="blue"
          />
          <GameCard
            title="🔊 Phonics Matching"
            description="Match sounds to letters"
            onClick={startPhonicsMatching}
            color="green"
          />
          <GameCard
            title="🔗 Blending Practice"
            description="Combine sounds to make words"
            onClick={startBlendingPractice}
            color="purple"
          />
        </div>

        {/* Active Game Area */}
        {activeGame?.current_challenge && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Word Builder Challenge</h2>
            <div className="mb-6">
              <p className="text-lg mb-2">Build the word: <strong>{activeGame.current_challenge.word}</strong></p>
              <p className="text-gray-600">{activeGame.current_challenge.definition}</p>
            </div>
            
            {/* Available Tiles */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Available Letters:</h3>
              <div className="flex flex-wrap gap-3">
                {activeGame.current_challenge.available_tiles?.map((tile: any) => (
                  <TileComponent
                    key={tile.id}
                    tile={tile}
                    isSelected={selectedTiles.includes(tile.id)}
                    onClick={() => handleTileSelect(tile.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Selected Tiles Display */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Your Word:</h3>
              <div className="flex gap-2 min-h-[60px] p-4 bg-gray-50 rounded-lg">
                {selectedTiles.map((tileId, index) => {
                  const tile = activeGame.current_challenge.available_tiles?.find((t: any) => t.id === tileId);
                  return tile ? (
                    <div key={index} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
                      {tile.text}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            
            <button
              onClick={submitAnswer}
              disabled={selectedTiles.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Check Answer ✓
            </button>
          </div>
        )}

        {/* Phonics Activity Area */}
        {phonicsSession?.current_activity && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Phonics Activity</h2>
            
            {/* Sound Matching */}
            {phonicsSession.current_activity.target_sound && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Find the letter that makes this sound:
                  </h3>
                  <div className="bg-yellow-100 p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-yellow-800 mb-2">
                      {phonicsSession.current_activity.target_sound}
                    </div>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
                      🔊 Play Sound
                    </button>
                  </div>
                </div>
                
                {/* Teaching Cues */}
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Teaching Hints:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Mouth:</strong> {phonicsSession.current_activity.teaching_cues?.mouth_position}</p>
                    <p><strong>Gesture:</strong> {phonicsSession.current_activity.teaching_cues?.hand_gesture}</p>
                    <p><strong>Memory Trick:</strong> {phonicsSession.current_activity.teaching_cues?.memory_trick}</p>
                  </div>
                </div>
                
                {/* Letter Options */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Choose the Correct Letter:</h3>
                  <div className="flex flex-wrap gap-3">
                    {phonicsSession.current_activity.letter_options?.map((tile: any) => (
                      <TileComponent
                        key={tile.id}
                        tile={tile}
                        isSelected={selectedTiles.includes(tile.id)}
                        onClick={() => handleTileSelect(tile.id)}
                        color="green"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Blending Practice */}
            {phonicsSession.current_activity.word_to_build && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Blend these sounds to make: <strong>{phonicsSession.current_activity.word_to_build}</strong>
                </h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Sound Tiles:</h4>
                  <div className="flex gap-3 mb-4">
                    {phonicsSession.current_activity.sound_tiles?.map((tile: any, index: number) => (
                      <div key={tile.id} className="text-center">
                        <TileComponent
                          tile={tile}
                          isSelected={false}
                          onClick={() => {}}
                          color="purple"
                        />
                        <div className="text-sm mt-1 text-gray-500">
                          {tile.phonetic_sound}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Blending Steps */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Blending Steps:</h4>
                  <div className="space-y-2">
                    {phonicsSession.current_activity.blending_steps?.map((step: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.instruction}</div>
                          <div className="text-sm text-gray-600">Expected: {step.expected_sound}</div>
                        </div>
                        <button className="bg-purple-200 hover:bg-purple-300 px-3 py-1 rounded text-sm">
                          🔊 Listen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={submitAnswer}
              disabled={selectedTiles.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Check Answer ✓
            </button>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {feedbackMessage.includes('Excellent') || feedbackMessage.includes('Perfect') ? '🎉' : '💪'}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {feedbackMessage.includes('Excellent') ? 'Fantastic!' : 'Keep Trying!'}
                </h3>
                <p className="text-gray-600 mb-4">{feedbackMessage}</p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🎯 How to Play</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Choose a reading game from the options above</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Listen to instructions and practice sounds</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Select tiles to build words or match sounds</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Get feedback and earn points for correct answers</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🏆 Learning Goals</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-600">📝</span>
                <span>Learn letter sounds and phonics patterns</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600">🔤</span>
                <span>Build and spell words using tiles</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600">👂</span>
                <span>Develop listening and blending skills</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600">📚</span>
                <span>Improve reading fluency and comprehension</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Card Component
function GameCard({ title, description, onClick, color }: {
  title: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left`}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-blue-100">{description}</p>
    </button>
  );
}

// Tile Component
function TileComponent({ tile, isSelected, onClick, color = 'blue' }: {
  tile: any;
  isSelected: boolean;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple';
}) {
  const baseClasses = "px-4 py-3 rounded-lg font-bold text-lg cursor-pointer transition-all transform hover:scale-105 shadow-md";
  
  const colorClasses = {
    blue: isSelected 
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    green: isSelected 
      ? 'bg-green-600 text-white shadow-lg' 
      : 'bg-green-100 text-green-800 hover:bg-green-200',
    purple: isSelected 
      ? 'bg-purple-600 text-white shadow-lg' 
      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorClasses[color]}`}
    >
      {tile.display_text || tile.text}
    </button>
  );
}