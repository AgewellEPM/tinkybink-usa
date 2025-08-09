'use client';

import React, { useState } from 'react';
import AIGameBuilder from '@/components/ai-game-builder';
import { GeneratedGame } from '@/services/ai-game-builder-service';

export default function GameBuilderPage() {
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);

  const handleGameGenerated = (game: GeneratedGame) => {
    setGeneratedGames(prev => [game, ...prev]);
  };

  return (
    <div className="game-builder-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>🤖 AI-Powered Game Builder</h1>
          <p className="hero-subtitle">
            Transform your ideas into therapeutic games instantly! Just describe what you need, 
            and our AI will build custom emoji-based games using your tile system.
          </p>
          
          <div className="features-highlight">
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Natural Language Input</span>
            </div>
            <div className="feature">
              <span className="feature-icon">😀</span>
              <span>Emoji-Based Visuals</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🧩</span>
              <span>Tile System Integration</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Instant Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Game Builder Component */}
      <div className="builder-section">
        <AIGameBuilder
          therapistId="therapist_demo"
          patientId="patient_demo"
          onGameGenerated={handleGameGenerated}
        />
      </div>

      {/* Generated Games History */}
      {generatedGames.length > 0 && (
        <div className="games-history">
          <h2>🎮 Your Generated Games ({generatedGames.length})</h2>
          <div className="games-grid">
            {generatedGames.map((game, index) => (
              <GameCard key={game.game_id} game={game} isNew={index === 0} />
            ))}
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="how-it-works">
        <h2>🔧 How It Works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Describe Your Need</h3>
            <p>Tell the AI what kind of game you want in natural language. 
               "I need a matching game with animals for a 5-year-old"</p>
            <div className="step-examples">
              <span>🗣️ Natural language</span>
              <span>👶 Patient info</span>
              <span>🎯 Therapy goals</span>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Analyzes & Plans</h3>
            <p>Our AI understands your request and automatically selects the best 
               emoji categories, game mechanics, and difficulty level.</p>
            <div className="step-examples">
              <span>🤖 AI processing</span>
              <span>😀 Emoji selection</span>
              <span>📊 Difficulty tuning</span>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>Game Gets Built</h3>
            <p>The system creates interactive tiles, game rules, success criteria, 
               and adaptive features tailored to your patient's needs.</p>
            <div className="step-examples">
              <span>🧩 Tile creation</span>
              <span>📋 Rule system</span>
              <span>🏆 Success metrics</span>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h3>Deploy & Play</h3>
            <p>Your custom game is instantly deployed to the tile system, 
               ready for immediate use in therapy sessions.</p>
            <div className="step-examples">
              <span>🚀 Instant deploy</span>
              <span>📱 Ready to play</span>
              <span>📈 Progress tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Example Games Showcase */}
      <div className="example-games">
        <h2>🌟 Example Generated Games</h2>
        <div className="examples-grid">
          <div className="example-game">
            <div className="example-header">
              <h3>🐶 Match the Animals</h3>
              <span className="difficulty">Easy</span>
            </div>
            <div className="example-emojis">
              <span>🐶</span><span>🐱</span><span>🐭</span><span>🐹</span>
              <span>🐰</span><span>🦊</span><span>🐻</span><span>🐼</span>
            </div>
            <p>Matching game for visual recognition and memory skills</p>
            <div className="example-skills">
              <span>Visual Recognition</span>
              <span>Memory</span>
              <span>Fine Motor</span>
            </div>
          </div>

          <div className="example-game">
            <div className="example-header">
              <h3>😀 Emotion Sequencing</h3>
              <span className="difficulty">Medium</span>
            </div>
            <div className="example-emojis">
              <span>😀</span><span>😢</span><span>😠</span><span>😱</span>
              <span>😴</span><span>🤔</span><span>😍</span><span>😭</span>
            </div>
            <p>Sequencing activity for emotional recognition and social skills</p>
            <div className="example-skills">
              <span>Emotional</span>
              <span>Social</span>
              <span>Sequencing</span>
            </div>
          </div>

          <div className="example-game">
            <div className="example-header">
              <h3>🔴 Sort the Colors</h3>
              <span className="difficulty">Easy</span>
            </div>
            <div className="example-emojis">
              <span>🔴</span><span>🟠</span><span>🟡</span><span>🟢</span>
              <span>🔵</span><span>🟣</span><span>🖤</span><span>🤍</span>
            </div>
            <p>Categorization game for cognitive development and color recognition</p>
            <div className="example-skills">
              <span>Cognitive</span>
              <span>Categorization</span>
              <span>Color Recognition</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .game-builder-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .hero-section {
          padding: 60px 20px;
          text-align: center;
          color: white;
        }

        .hero-content h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hero-subtitle {
          font-size: 20px;
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
          opacity: 0.95;
        }

        .features-highlight {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
          margin-top: 40px;
        }

        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          min-width: 140px;
        }

        .feature-icon {
          font-size: 32px;
        }

        .feature span:last-child {
          font-size: 14px;
          font-weight: 500;
        }

        .builder-section {
          background: #f5f7fa;
          padding: 40px 20px;
        }

        .games-history {
          background: white;
          padding: 40px 20px;
        }

        .games-history h2 {
          text-align: center;
          font-size: 28px;
          color: #1a202c;
          margin-bottom: 32px;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .how-it-works {
          background: #f7fafc;
          padding: 60px 20px;
        }

        .how-it-works h2 {
          text-align: center;
          font-size: 32px;
          color: #1a202c;
          margin-bottom: 48px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .step {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .step h3 {
          font-size: 20px;
          color: #1a202c;
          margin: 16px 0 12px 0;
        }

        .step p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .step-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .step-examples span {
          padding: 4px 8px;
          background: #edf2f7;
          border-radius: 12px;
          font-size: 12px;
          color: #4a5568;
          font-weight: 500;
        }

        .example-games {
          background: white;
          padding: 60px 20px;
        }

        .example-games h2 {
          text-align: center;
          font-size: 32px;
          color: #1a202c;
          margin-bottom: 48px;
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .example-game {
          background: #f7fafc;
          padding: 24px;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .example-game:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .example-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .example-header h3 {
          font-size: 18px;
          color: #1a202c;
          margin: 0;
        }

        .difficulty {
          padding: 4px 12px;
          background: #667eea;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .example-emojis {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          justify-content: center;
        }

        .example-emojis span {
          font-size: 24px;
          padding: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .example-game p {
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
          text-align: center;
        }

        .example-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .example-skills span {
          padding: 4px 8px;
          background: #e6fffa;
          color: #285e61;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .features-highlight {
            gap: 16px;
          }

          .feature {
            min-width: 120px;
            padding: 12px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .examples-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// Game Card Component for History
function GameCard({ game, isNew }: { game: GeneratedGame; isNew: boolean }) {
  return (
    <div className={`game-card ${isNew ? 'new-game' : ''}`}>
      {isNew && <div className="new-badge">✨ Just Created!</div>}
      
      <div className="card-header">
        <h3>{game.game_name}</h3>
        <div className="card-meta">
          <span className="difficulty">{game.difficulty_level}</span>
          <span className="duration">{game.estimated_duration}min</span>
        </div>
      </div>

      <div className="card-emojis">
        {game.tiles.slice(0, 8).map((tile, index) => (
          <span key={index} className="card-emoji">{tile.emoji}</span>
        ))}
        {game.tiles.length > 8 && (
          <span className="more-emojis">+{game.tiles.length - 8}</span>
        )}
      </div>

      <p className="card-description">{game.description}</p>

      <div className="card-skills">
        {game.target_skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      <div className="card-actions">
        <button className="play-button">🎮 Play Now</button>
        <button className="edit-button">✏️ Edit</button>
      </div>

      <style jsx>{`
        .game-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 2px solid transparent;
          transition: all 0.3s;
          position: relative;
        }

        .game-card.new-game {
          border-color: #48bb78;
          box-shadow: 0 4px 20px rgba(72, 187, 120, 0.2);
          transform: scale(1.02);
        }

        .new-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #48bb78;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-header h3 {
          font-size: 16px;
          color: #1a202c;
          margin: 0;
          flex: 1;
        }

        .card-meta {
          display: flex;
          gap: 6px;
        }

        .card-meta span {
          padding: 2px 6px;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 10px;
          color: #666;
          font-weight: 500;
        }

        .card-emojis {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .card-emoji {
          font-size: 20px;
          padding: 4px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .more-emojis {
          padding: 4px 8px;
          background: #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          color: #4a5568;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .card-description {
          font-size: 13px;
          color: #4a5568;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .card-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 16px;
        }

        .skill-tag {
          padding: 3px 6px;
          background: #e6fffa;
          color: #285e61;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .play-button, .edit-button {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-button {
          background: #48bb78;
          color: white;
        }

        .play-button:hover {
          background: #38a169;
          transform: translateY(-1px);
        }

        .edit-button {
          background: #edf2f7;
          color: #4a5568;
        }

        .edit-button:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}