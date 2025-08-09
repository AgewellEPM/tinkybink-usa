'use client';

import { useState, useEffect } from 'react';
import { memoryGamesService } from '@/services/memory-games-service';

export default function MemoryGamesPage() {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [gameStats, setGameStats] = useState({
    score: 0,
    challengesCompleted: 0,
    challengesCorrect: 0,
    currentStreak: 0,
    memorySpan: 0
  });
  const [isStudyPhase, setIsStudyPhase] = useState(false);
  const [studyTimeRemaining, setStudyTimeRemaining] = useState(0);
  const [userResponse, setUserResponse] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMemoryAnalytics();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (studyTimeRemaining > 0) {
      timer = setTimeout(() => {
        setStudyTimeRemaining(prev => prev - 100);
      }, 100);
    } else if (studyTimeRemaining === 0 && isStudyPhase) {
      setIsStudyPhase(false);
    }
    return () => clearTimeout(timer);
  }, [studyTimeRemaining, isStudyPhase]);

  const loadMemoryAnalytics = async () => {
    try {
      const analytics = await memoryGamesService.getMemoryAnalytics('demo_student');
      console.log('Memory Analytics:', analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const startGame = async (gameType: string) => {
    setIsLoading(true);
    try {
      const gameSession = await memoryGamesService.startMemoryGame(
        'demo_student',
        gameType as any,
        2 // Default difficulty
      );
      
      setActiveGame(gameSession);
      setGameStats({
        score: 0,
        challengesCompleted: 0,
        challengesCorrect: 0,
        currentStreak: 0,
        memorySpan: 0
      });

      // Load first challenge based on game type
      let challenge;
      switch (gameType) {
        case 'visual_sequence':
          challenge = await memoryGamesService.playVisualSequenceGame(gameSession.session_id);
          break;
        case 'pattern_memory':
          challenge = await memoryGamesService.playPatternMemoryGame(gameSession.session_id);
          break;
        case 'spatial_memory':
          challenge = await memoryGamesService.playSpatialMemoryGame(gameSession.session_id);
          break;
        case 'working_memory':
          challenge = await memoryGamesService.playWorkingMemoryGame(gameSession.session_id);
          break;
        case 'tile_memory':
          challenge = await memoryGamesService.playTileMemoryGame(gameSession.session_id);
          break;
        default:
          challenge = await memoryGamesService.playVisualSequenceGame(gameSession.session_id);
      }

      setCurrentChallenge(challenge);
      setIsStudyPhase(true);
      setStudyTimeRemaining(challenge.display_duration);
      setUserResponse([]);
      
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSelection = (item: any) => {
    setUserResponse(prev => {
      const exists = prev.find(r => r.tile_id === item.tile_id);
      if (exists) {
        return prev.filter(r => r.tile_id !== item.tile_id);
      } else {
        return [...prev, item];
      }
    });
  };

  const submitResponse = async () => {
    if (!currentChallenge || userResponse.length === 0) return;
    
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const result = await memoryGamesService.processMemoryResponse(
        currentChallenge.challenge_id,
        userResponse,
        performance.now() - startTime
      );
      
      setFeedbackData(result);
      setShowFeedback(true);
      
      // Update game stats
      setGameStats(prev => ({
        ...prev,
        challengesCompleted: prev.challengesCompleted + 1,
        challengesCorrect: result.correct ? prev.challengesCorrect + 1 : prev.challengesCorrect,
        currentStreak: result.correct ? prev.currentStreak + 1 : 0,
        memorySpan: Math.max(prev.memorySpan, result.memory_span_achieved)
      }));
      
      // Auto-hide feedback and potentially load next challenge
      setTimeout(() => {
        setShowFeedback(false);
        setUserResponse([]);
        
        // For demo, we'll just reset after each challenge
        // In production, you'd load the next challenge
      }, 4000);
      
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setActiveGame(null);
    setCurrentChallenge(null);
    setUserResponse([]);
    setShowFeedback(false);
    setIsStudyPhase(false);
    setStudyTimeRemaining(0);
    setGameStats({ score: 0, challengesCompleted: 0, challengesCorrect: 0, currentStreak: 0, memorySpan: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧠 Memory Training Games
          </h1>
          <p className="text-lg text-gray-600">
            Build and strengthen memory skills through interactive challenges!
          </p>
          
          {/* Game Stats */}
          {activeGame && (
            <div className="flex justify-center space-x-6 mt-4">
              <StatCard label="Completed" value={gameStats.challengesCompleted} color="blue" />
              <StatCard label="Correct" value={`${gameStats.challengesCorrect}/${gameStats.challengesCompleted}`} color="green" />
              <StatCard label="Streak" value={gameStats.currentStreak} color="purple" />
              <StatCard label="Memory Span" value={gameStats.memorySpan} color="indigo" />
            </div>
          )}
        </div>

        {!activeGame ? (
          // Game Selection Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCard
              title="🎨 Visual Sequence"
              description="Remember the order of colored tiles"
              difficulty="Easy to Medium"
              timeEstimate="5 min"
              onClick={() => startGame('visual_sequence')}
              color="red"
            />
            
            <GameCard
              title="🧩 Pattern Memory"
              description="Memorize patterns on a grid"
              difficulty="Medium"
              timeEstimate="8 min"
              onClick={() => startGame('pattern_memory')}
              color="blue"
            />
            
            <GameCard
              title="🗺️ Spatial Memory"
              description="Remember object locations"
              difficulty="Medium to Hard"
              timeEstimate="10 min"
              onClick={() => startGame('spatial_memory')}
              color="green"
            />
            
            <GameCard
              title="🔄 Working Memory"
              description="N-back memory training"
              difficulty="Hard"
              timeEstimate="15 min"
              onClick={() => startGame('working_memory')}
              color="purple"
            />
            
            <GameCard
              title="🎯 Tile Memory"
              description="AAC tile sequence memory"
              difficulty="Easy to Hard"
              timeEstimate="7 min"
              onClick={() => startGame('tile_memory')}
              color="indigo"
            />
          </div>
        ) : (
          // Active Game Interface
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {activeGame?.game_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Memory Game
              </h2>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to Games
              </button>
            </div>
            
            {/* Study Phase */}
            {isStudyPhase && (
              <div className="mb-8 text-center">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">📚 Study Phase</h3>
                  <div className="bg-blue-100 rounded-full h-4 mb-2">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-100"
                      style={{ width: `${Math.max(0, (studyTimeRemaining / currentChallenge?.display_duration) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-blue-600 font-bold">
                    Memorize the sequence: {Math.ceil(studyTimeRemaining / 1000)}s remaining
                  </p>
                </div>
                
                {/* Visual Sequence Display */}
                {currentChallenge?.game_type === 'visual_sequence' && (
                  <div className="flex justify-center gap-3">
                    {currentChallenge.sequence_to_remember.map((item: any, index: number) => (
                      <div key={index} className="text-4xl animate-pulse">
                        {item.display}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pattern Memory Display */}
                {currentChallenge?.game_type === 'pattern_memory' && (
                  <div className="inline-block">
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 16 }, (_, i) => {
                        const row = Math.floor(i / 4);
                        const col = i % 4;
                        const hasPattern = currentChallenge.sequence_to_remember.find(
                          (p: any) => p.row === row && p.col === col
                        );
                        return (
                          <div
                            key={i}
                            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl ${
                              hasPattern ? 'bg-yellow-200 border-yellow-400' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            {hasPattern?.symbol || ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Spatial Memory Display */}
                {currentChallenge?.game_type === 'spatial_memory' && (
                  <div className="inline-block">
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 9 }, (_, i) => {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        const hasItem = currentChallenge.sequence_to_remember.find(
                          (item: any) => item.coordinate[0] === row && item.coordinate[1] === col
                        );
                        return (
                          <div
                            key={i}
                            className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl ${
                              hasItem ? 'bg-green-200 border-green-400' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            {hasItem?.emoji || ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Tile Memory Display */}
                {currentChallenge?.game_type === 'tile_memory' && (
                  <div className="flex justify-center gap-3">
                    {currentChallenge.sequence_to_remember.map((tile: any, index: number) => (
                      <div key={index} className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 text-3xl">
                        {tile.display_text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Response Phase */}
            {!isStudyPhase && currentChallenge && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">
                    🎯 Now select the items in the correct order!
                  </h3>
                  
                  {/* User's Current Response */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Your Selection:</h4>
                    <div className="flex justify-center gap-2 min-h-[60px] flex-wrap">
                      {userResponse.map((item, index) => (
                        <div key={index} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                          {item.display || item.display_text || item.symbol || item.emoji || item.tile_id}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Response Options */}
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
                    {currentChallenge.sequence_to_remember.map((item: any, index: number) => (
                      <button
                        key={item.tile_id || index}
                        onClick={() => handleResponseSelection(item)}
                        className={`p-3 rounded-lg font-bold text-lg transition-all border-2 ${
                          userResponse.find(r => r.tile_id === item.tile_id)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                        }`}
                      >
                        {item.display || item.display_text || item.symbol || item.emoji || '?'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setUserResponse([])}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    🔄 Clear
                  </button>
                  <button
                    onClick={submitResponse}
                    disabled={userResponse.length === 0 || isLoading}
                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    ✓ Submit Response
                  </button>
                </div>
              </div>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading memory challenge...</p>
            </div>
          </div>
        )}

        {/* Instructions Panel */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🧠 How Memory Training Works</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Study the sequence during the memorization phase</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Recall and select items in the correct order</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Get feedback and improve your memory span</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Challenge yourself with harder difficulties</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🎯 Memory Benefits</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="text-purple-600">🧠</span>
                <span>Strengthen working memory capacity</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600">⚡</span>
                <span>Improve attention and focus</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600">🎯</span>
                <span>Enhance pattern recognition</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-600">📈</span>
                <span>Boost cognitive processing speed</span>
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
    red: 'from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
    blue: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    green: 'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
    purple: 'from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600',
    indigo: 'from-indigo-400 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600'
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
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
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

// Feedback Modal
function FeedbackModal({ feedback, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">
            {feedback.correct ? '🎉' : '🧠'}
          </div>
          <h3 className="text-xl font-bold mb-2">
            {feedback.correct ? 'Great Memory!' : 'Keep Training!'}
          </h3>
          <p className="text-gray-600 mb-4">
            Memory span achieved: {feedback.memory_span_achieved}
          </p>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              Cognitive Load: {feedback.cognitive_load_level}
            </p>
            <p className="text-sm text-blue-700">
              Accuracy: {feedback.accuracy_percentage.toFixed(1)}%
            </p>
          </div>
          
          {feedback.improvement_suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">💡 Tips:</h4>
              {feedback.improvement_suggestions.map((tip: string, index: number) => (
                <p key={index} className="text-sm text-gray-600 mb-1">
                  • {tip}
                </p>
              ))}
            </div>
          )}
          
          <div className="text-lg font-bold text-blue-600">
            Next difficulty: Level {feedback.next_difficulty_recommendation}
          </div>
        </div>
      </div>
    </div>
  );
}