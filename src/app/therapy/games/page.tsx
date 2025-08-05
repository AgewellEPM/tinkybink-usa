'use client';

import { useState, useEffect } from 'react';
import { therapyGamesService } from '@/services/therapy-games-service';

export default function TherapyGames() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTherapy, setSelectedTherapy] = useState<'slp' | 'aba' | 'ot' | 'pt' | 'all'>('all');
  const [games, setGames] = useState<any[]>([]);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [gameSession, setGameSession] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);

  useEffect(() => {
    loadGames();
  }, [selectedTherapy]);

  const loadGames = async () => {
    // Mock games data based on our service
    const allGames = [
      {
        id: 'picture_naming',
        name: 'Picture Naming Challenge',
        description: 'Name pictures to build expressive vocabulary',
        category: 'communication',
        therapy_types: ['slp'],
        difficulty_levels: ['Single Words', 'Phrases', 'Sentences'],
        evidence_level: 'high',
        min_age: 2,
        max_age: 12,
        session_duration: [5, 10, 15],
        preview_image: '🖼️'
      },
      {
        id: 'sentence_builder',
        name: 'Sentence Building Adventure',
        description: 'Construct sentences using drag-and-drop word tiles',
        category: 'language',
        therapy_types: ['slp'],
        difficulty_levels: ['2-word', '3-word', '4+ word', 'Complex'],
        evidence_level: 'high',
        min_age: 4,
        max_age: 16,
        session_duration: [10, 15, 20, 25],
        preview_image: '🧩'
      },
      {
        id: 'matching_mastery',
        name: 'Matching Mastery',
        description: 'Build cognitive skills through systematic matching tasks',
        category: 'cognitive',
        therapy_types: ['aba', 'slp'],
        difficulty_levels: ['Identical', 'Similar', 'Category', 'Function'],
        evidence_level: 'high',
        min_age: 2,
        max_age: 10,
        session_duration: [5, 10, 15],
        preview_image: '🎯'
      },
      {
        id: 'finger_painting',
        name: 'Digital Finger Painting',
        description: 'Develop fine motor skills through creative digital art',
        category: 'motor',
        therapy_types: ['ot'],
        difficulty_levels: ['Free Draw', 'Trace Lines', 'Complete Shapes', 'Detailed Art'],
        evidence_level: 'moderate',
        min_age: 2,
        max_age: 8,
        session_duration: [10, 15, 20],
        preview_image: '🎨'
      },
      {
        id: 'emotion_detective',
        name: 'Emotion Detective',
        description: 'Learn to recognize and express emotions',
        category: 'social',
        therapy_types: ['slp', 'aba'],
        difficulty_levels: ['Basic Emotions', 'Complex Emotions', 'Social Situations'],
        evidence_level: 'moderate',
        min_age: 3,
        max_age: 12,
        session_duration: [10, 15, 20],
        preview_image: '😊'
      },
      {
        id: 'balance_adventure',
        name: 'Balance Adventure',
        description: 'Improve gross motor skills and balance',
        category: 'motor',
        therapy_types: ['pt'],
        difficulty_levels: ['Beginner', 'Intermediate', 'Advanced'],
        evidence_level: 'moderate',
        min_age: 3,
        max_age: 12,
        session_duration: [15, 20, 25],
        preview_image: '⚖️'
      }
    ];

    let filteredGames = allGames;
    if (selectedTherapy !== 'all') {
      filteredGames = allGames.filter(game => game.therapy_types.includes(selectedTherapy));
    }
    if (selectedCategory !== 'all') {
      filteredGames = filteredGames.filter(game => game.category === selectedCategory);
    }

    setGames(filteredGames);
  };

  const startGame = async (game: any) => {
    try {
      const sessionId = await therapyGamesService.startGameSession(
        game.id,
        'patient_123',
        'therapist_456',
        {
          difficulty_level: game.difficulty_levels[0],
          duration_minutes: game.session_duration[1],
          theme: 'default'
        }
      );

      setGameSession(sessionId);
      setActiveGame(game);
      setSessionStats({
        startTime: new Date(),
        attempts: 0,
        correct: 0,
        streak: 0,
        level: 1
      });
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const recordGameResponse = async (stimulus: string, response: string, correct: boolean) => {
    if (!gameSession) return;

    try {
      await therapyGamesService.recordGameResponse(
        gameSession,
        stimulus,
        response,
        correct,
        Math.random() * 3000 + 1000 // Mock response time
      );

      // Update local stats
      setSessionStats((prev: any) => ({
        ...prev,
        attempts: prev.attempts + 1,
        correct: prev.correct + (correct ? 1 : 0),
        streak: correct ? prev.streak + 1 : 0
      }));
    } catch (error) {
      console.error('Failed to record response:', error);
    }
  };

  const endGame = async () => {
    if (!gameSession) return;

    try {
      const session = await therapyGamesService.endGameSession(gameSession, 'Great session!');
      alert(`Game completed!\nAccuracy: ${Math.round((sessionStats.correct / sessionStats.attempts) * 100)}%\nTime: ${Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000)} minutes`);
      
      setGameSession(null);
      setActiveGame(null);
      setSessionStats(null);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  if (activeGame && gameSession) {
    return <GamePlayInterface 
      game={activeGame}
      sessionStats={sessionStats}
      onResponse={recordGameResponse}
      onEndGame={endGame}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Therapy Games</h1>
          <p className="text-pink-200">Evidence-based games for engaging therapy sessions</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <label className="block text-white mb-2">Therapy Type</label>
            <select
              value={selectedTherapy}
              onChange={(e) => setSelectedTherapy(e.target.value as any)}
              className="w-full p-3 rounded-lg bg-white/20 text-white"
            >
              <option value="all">All Therapies</option>
              <option value="slp">Speech-Language Pathology</option>
              <option value="aba">Applied Behavior Analysis</option>
              <option value="ot">Occupational Therapy</option>
              <option value="pt">Physical Therapy</option>
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <label className="block text-white mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white"
            >
              <option value="all">All Categories</option>
              <option value="communication">Communication</option>
              <option value="language">Language</option>
              <option value="cognitive">Cognitive</option>
              <option value="motor">Motor Skills</option>
              <option value="social">Social Skills</option>
            </select>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div key={game.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all">
              {/* Game Preview */}
              <div className="text-6xl mb-4 text-center">{game.preview_image}</div>
              
              {/* Game Info */}
              <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-purple-200 mb-4 text-sm">{game.description}</p>
              
              {/* Game Details */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Therapy:</span>
                  <span className="text-white">{game.therapy_types.join(', ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Age Range:</span>
                  <span className="text-white">{game.min_age}-{game.max_age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Evidence:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    game.evidence_level === 'high' ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'
                  }`}>
                    {game.evidence_level.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-white">{game.session_duration.join('-')} min</span>
                </div>
              </div>

              {/* Difficulty Levels */}
              <div className="mb-4">
                <div className="text-xs text-gray-300 mb-2">Difficulty Levels:</div>
                <div className="flex flex-wrap gap-1">
                  {game.difficulty_levels.map((level: string) => (
                    <span key={level} className="px-2 py-1 bg-white/20 rounded text-xs text-white">
                      {level}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startGame(game)}
                  className="py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                >
                  ▶️ Play
                </button>
                <button className="py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all">
                  📊 Stats
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-500/20 rounded-lg text-white hover:bg-blue-500/30 transition-all">
              🎯 Create Custom Game
            </button>
            <button className="p-4 bg-purple-500/20 rounded-lg text-white hover:bg-purple-500/30 transition-all">
              📈 View Analytics
            </button>
            <button className="p-4 bg-yellow-500/20 rounded-lg text-white hover:bg-yellow-500/30 transition-all">
              👥 Multiplayer Games
            </button>
            <button className="p-4 bg-pink-500/20 rounded-lg text-white hover:bg-pink-500/30 transition-all">
              💾 Game Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Play Interface Component
function GamePlayInterface({ game, sessionStats, onResponse, onEndGame }: any) {
  const [currentStimulus, setCurrentStimulus] = useState('apple');
  const [gameState, setGameState] = useState('playing');

  const handleResponse = (response: string, correct: boolean) => {
    onResponse(currentStimulus, response, correct);
    
    // Move to next stimulus
    const stimuli = ['apple', 'car', 'house', 'dog', 'ball'];
    const nextStimulus = stimuli[Math.floor(Math.random() * stimuli.length)];
    setCurrentStimulus(nextStimulus);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">{game.preview_image} {game.name}</h1>
              <p className="text-green-200">Level 1 • Single Words</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{sessionStats.correct}/{sessionStats.attempts}</div>
              <div className="text-green-200 text-sm">
                {sessionStats.attempts > 0 ? Math.round((sessionStats.correct / sessionStats.attempts) * 100) : 0}% Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Game Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{sessionStats.streak}</div>
            <div className="text-white text-sm">Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{sessionStats.level}</div>
            <div className="text-white text-sm">Level</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000)}m
            </div>
            <div className="text-white text-sm">Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">⭐</div>
            <div className="text-white text-sm">Score</div>
          </div>
        </div>

        {/* Game Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6">
          <div className="text-center">
            {/* Stimulus Display */}
            <div className="mb-8">
              <div className="text-8xl mb-4">🍎</div>
              <h2 className="text-3xl font-bold text-white">What is this?</h2>
            </div>

            {/* Response Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Apple', 'Orange', 'Banana', 'Grape'].map(option => (
                <button
                  key={option}
                  onClick={() => handleResponse(option, option === 'Apple')}
                  className="p-6 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold text-xl transition-all transform hover:scale-105"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={onEndGame}
            className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
          >
            ⏹️ End Game
          </button>
          
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all">
              ⏸️ Pause
            </button>
            <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all">
              🔄 Skip
            </button>
            <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all">
              💡 Hint
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-lg p-4">
          <div className="flex justify-between text-white text-sm mb-2">
            <span>Session Progress</span>
            <span>{sessionStats.attempts}/20 attempts</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(sessionStats.attempts / 20) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}