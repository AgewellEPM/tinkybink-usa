'use client';

import React, { useState } from 'react';
import { aiGameBuilderService, GameRequest, GeneratedGame } from '../services/ai-game-builder-service';

interface AIGameBuilderProps {
  therapistId: string;
  patientId?: string;
  onGameGenerated?: (game: GeneratedGame) => void;
}

export default function AIGameBuilder({ 
  therapistId, 
  patientId,
  onGameGenerated 
}: AIGameBuilderProps) {
  const [request, setRequest] = useState('');
  const [patientAge, setPatientAge] = useState<number | undefined>();
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [sessionDuration, setSessionDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GeneratedGame | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Example requests for inspiration
  const exampleRequests = [
    "I need a matching game with animal emojis for a 5-year-old with autism to improve focus",
    "Create a sequencing activity using emotion emojis for social skills development",
    "Make a color recognition game with simple shapes for fine motor skills",
    "Build a memory game with food emojis to practice categorization",
    "Design a selection game with weather emojis for language development",
    "Create a sorting activity with number emojis for cognitive skills"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setIsGenerating(true);
    setGeneratedGame(null);

    try {
      const gameRequest = {
        therapist_id: therapistId,
        patient_id: patientId,
        natural_language_request: request,
        patient_age: patientAge,
        skill_level: skillLevel,
        session_duration: sessionDuration,
        therapy_goals: []
      };

      const generated = await aiGameBuilderService.generateGameFromRequest(gameRequest);
      setGeneratedGame(generated);
      onGameGenerated?.(generated);
      
    } catch (error) {
      console.error('Failed to generate game:', error);
      alert('Failed to generate game. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setRequest(example);
  };

  const handleDeployGame = async () => {
    if (generatedGame) {
      console.log('Deploying game to patient session:', generatedGame.game_id);
      // Integration with tile system would happen here
      alert(`Game "${generatedGame.game_name}" deployed successfully! 🎮`);
    }
  };

  return (
    <div className="ai-game-builder">
      <div className="builder-header">
        <h2>🤖 AI Game Builder</h2>
        <p>Describe the game you need and I'll build it instantly using emoji tiles!</p>
      </div>

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="request-form">
        <div className="request-input-group">
          <label htmlFor="gameRequest">What kind of game do you need?</label>
          <textarea
            id="gameRequest"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Describe the game you want... e.g., 'I need a matching game with animal emojis for a 6-year-old to improve focus and visual recognition'"
            rows={4}
            className="request-textarea"
          />
        </div>

        {/* Example Requests */}
        <div className="examples-section">
          <h4>💡 Need inspiration? Try these examples:</h4>
          <div className="examples-grid">
            {exampleRequests.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="example-button"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="quick-settings">
          <div className="setting-group">
            <label htmlFor="patientAge">Patient Age</label>
            <input
              id="patientAge"
              type="number"
              min="2"
              max="18"
              value={patientAge || ''}
              onChange={(e) => setPatientAge(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Optional"
              className="age-input"
            />
          </div>

          <div className="setting-group">
            <label htmlFor="skillLevel">Skill Level</label>
            <select
              id="skillLevel"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as any)}
              className="skill-select"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="duration">Session Duration (minutes)</label>
            <input
              id="duration"
              type="number"
              min="5"
              max="60"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(parseInt(e.target.value) || 15)}
              className="duration-input"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="advanced-toggle">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-button"
          >
            {showAdvanced ? '📖 Hide' : '⚙️ Show'} Advanced Settings
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="setting-group">
              <label>Preferred Emoji Categories</label>
              <div className="emoji-categories">
                {['😀 Emotions', '🐶 Animals', '🍎 Food', '🔴 Colors', '⭐ Shapes', '1️⃣ Numbers'].map(category => (
                  <label key={category} className="category-checkbox">
                    <input type="checkbox" />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Interaction Types</label>
              <div className="interaction-types">
                {['👆 Tap', '✋ Drag', '👋 Swipe', '🔄 Sequence'].map(interaction => (
                  <label key={interaction} className="interaction-checkbox">
                    <input type="checkbox" />
                    <span>{interaction}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={!request.trim() || isGenerating}
          className="generate-button"
        >
          {isGenerating ? (
            <>
              <span className="spinner">🔄</span>
              Generating Game...
            </>
          ) : (
            <>
              ✨ Generate Game
            </>
          )}
        </button>
      </form>

      {/* Generated Game Preview */}
      {generatedGame && (
        <div className="generated-game">
          <div className="game-header">
            <h3>🎮 {generatedGame.game_name}</h3>
            <div className="game-meta">
              <span className="difficulty">📊 {generatedGame.difficulty_level}</span>
              <span className="duration">⏱️ {generatedGame.estimated_duration} min</span>
              <span className="tiles">🧩 {generatedGame.tiles.length} tiles</span>
            </div>
          </div>

          <p className="game-description">{generatedGame.description}</p>

          {/* Emoji Tiles Preview */}
          <div className="tiles-preview">
            <h4>🎯 Game Tiles ({generatedGame.emoji_theme.theme_name})</h4>
            <div className="emoji-grid">
              {generatedGame.tiles.map((tile, index) => (
                <div 
                  key={tile.tile_id}
                  className="emoji-tile"
                  style={{ backgroundColor: generatedGame.emoji_theme.color_associations[tile.emoji] }}
                  title={`${tile.emoji} - ${tile.label} (${tile.therapeutic_value})`}
                >
                  <span className="emoji">{tile.emoji}</span>
                  <span className="label">{tile.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Game Rules */}
          <div className="game-rules">
            <h4>📋 Game Rules</h4>
            <div className="rules-list">
              {generatedGame.game_rules.map((rule, index) => (
                <div key={rule.rule_id} className="rule-item">
                  <span className="rule-type">{rule.rule_type}</span>
                  <span className="rule-description">{rule.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Criteria */}
          <div className="success-criteria">
            <h4>🏆 Success Criteria</h4>
            <div className="criteria-grid">
              <div className="criteria-item">
                <span className="label">Goal:</span>
                <span className="value">{generatedGame.success_criteria.primary_goal}</span>
              </div>
              <div className="criteria-item">
                <span className="label">Success Rate:</span>
                <span className="value">{generatedGame.success_criteria.success_percentage}%</span>
              </div>
              {generatedGame.success_criteria.time_limit && (
                <div className="criteria-item">
                  <span className="label">Time Limit:</span>
                  <span className="value">{generatedGame.success_criteria.time_limit}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Target Skills */}
          <div className="target-skills">
            <h4>🎯 Target Skills</h4>
            <div className="skills-list">
              {generatedGame.target_skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="game-actions">
            <button onClick={handleDeployGame} className="deploy-button">
              🚀 Deploy to Session
            </button>
            <button 
              onClick={() => setGeneratedGame(null)} 
              className="regenerate-button"
            >
              🔄 Generate New Game
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-game-builder {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .builder-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .builder-header h2 {
          font-size: 28px;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .builder-header p {
          font-size: 16px;
          color: #718096;
        }

        .request-form {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }

        .request-input-group {
          margin-bottom: 24px;
        }

        .request-input-group label {
          display: block;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .request-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .request-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .examples-section {
          margin-bottom: 24px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
        }

        .examples-section h4 {
          margin: 0 0 16px 0;
          color: #1a202c;
          font-size: 14px;
        }

        .examples-grid {
          display: grid;
          gap: 8px;
        }

        .example-button {
          padding: 12px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #4a5568;
        }

        .example-button:hover {
          border-color: #667eea;
          background: #f0f7ff;
          transform: translateX(4px);
        }

        .quick-settings {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
        }

        .setting-group label {
          font-weight: 500;
          color: #1a202c;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .age-input, .duration-input, .skill-select {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .age-input:focus, .duration-input:focus, .skill-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .advanced-toggle {
          margin-bottom: 16px;
        }

        .toggle-button {
          padding: 8px 16px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
        }

        .toggle-button:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .advanced-settings {
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .emoji-categories, .interaction-types {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .category-checkbox, .interaction-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .generate-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .generate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .generate-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .generated-game {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 2px solid #48bb78;
        }

        .game-header {
          margin-bottom: 16px;
        }

        .game-header h3 {
          font-size: 24px;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .game-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .game-meta span {
          padding: 4px 12px;
          background: #f7fafc;
          border-radius: 12px;
          font-size: 12px;
          color: #4a5568;
          font-weight: 500;
        }

        .game-description {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .tiles-preview h4, .game-rules h4, .success-criteria h4, .target-skills h4 {
          font-size: 16px;
          color: #1a202c;
          margin: 0 0 16px 0;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .emoji-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .emoji-tile:hover {
          transform: scale(1.05);
        }

        .emoji-tile .emoji {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .emoji-tile .label {
          font-size: 11px;
          color: white;
          font-weight: 500;
          text-align: center;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .rule-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .rule-type {
          padding: 4px 8px;
          background: #667eea;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .rule-description {
          color: #4a5568;
          font-size: 14px;
        }

        .criteria-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
        }

        .criteria-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .criteria-item .label {
          font-weight: 500;
          color: #4a5568;
        }

        .criteria-item .value {
          color: #1a202c;
          font-weight: 600;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .skill-tag {
          padding: 6px 12px;
          background: #e6fffa;
          color: #285e61;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .game-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .deploy-button, .regenerate-button {
          flex: 1;
          min-width: 200px;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .deploy-button {
          background: #48bb78;
          color: white;
        }

        .deploy-button:hover {
          background: #38a169;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(72, 187, 120, 0.3);
        }

        .regenerate-button {
          background: #edf2f7;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .regenerate-button:hover {
          background: #e2e8f0;
          border-color: #cbd5e0;
        }

        @media (max-width: 768px) {
          .ai-game-builder {
            padding: 16px;
          }

          .quick-settings {
            grid-template-columns: 1fr;
          }

          .game-meta {
            flex-direction: column;
            gap: 8px;
          }

          .emoji-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          }

          .game-actions {
            flex-direction: column;
          }

          .deploy-button, .regenerate-button {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}