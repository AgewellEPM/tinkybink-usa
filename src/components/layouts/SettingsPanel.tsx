'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { getLanguageService, getVoiceRecognitionService, getEducationalGamesService, getMemoryTrainingService, getSkillAssessmentService } from '@/modules/module-system';

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    speechRate,
    speechPitch,
    speechVolume,
    gridColumns,
    tileScale,
    updateSettings,
    setCurrentGame,
  } = useAppStore();

  // Listen for settings toggle
  useEffect(() => {
    const handleToggle = () => setIsOpen(!isOpen);
    window.addEventListener('toggleSettings', handleToggle);
    return () => window.removeEventListener('toggleSettings', handleToggle);
  }, [isOpen]);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [languageService, setLanguageService] = useState<ReturnType<typeof getLanguageService> | null>(null);
  const [voiceRecognition, setVoiceRecognition] = useState<ReturnType<typeof getVoiceRecognitionService> | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [voiceRecognitionEnabled, setVoiceRecognitionEnabled] = useState(false);
  const [gamesService, setGamesService] = useState<ReturnType<typeof getEducationalGamesService> | null>(null);
  const [memoryService, setMemoryService] = useState<ReturnType<typeof getMemoryTrainingService> | null>(null);
  const [assessmentService, setAssessmentService] = useState<ReturnType<typeof getSkillAssessmentService> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const langService = getLanguageService();
      console.log('Language service:', langService);
      console.log('Supported languages:', langService.getSupportedLanguages());
      setLanguageService(langService);
      setCurrentLanguage(langService.getCurrentLanguage());
      
      const voiceService = getVoiceRecognitionService();
      setVoiceRecognition(voiceService);
      
      // Initialize learning services
      const eduGamesService = getEducationalGamesService();
      const memTrainingService = getMemoryTrainingService();
      const skillAssessService = getSkillAssessmentService();
      
      eduGamesService.initialize();
      memTrainingService.initialize();
      skillAssessService.initialize();
      
      setGamesService(eduGamesService);
      setMemoryService(memTrainingService);
      setAssessmentService(skillAssessService);
    }
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleLanguageChange = (langCode: string) => {
    if (languageService?.setLanguage(langCode)) {
      setCurrentLanguage(langCode);
      // Update voice recognition language
      voiceRecognition?.setLanguage(langCode + '-' + langCode.toUpperCase());
    }
  };

  const toggleVoiceRecognition = () => {
    if (voiceRecognition?.isAvailable()) {
      const newState = !voiceRecognitionEnabled;
      setVoiceRecognitionEnabled(newState);
      
      if (newState) {
        voiceRecognition.start();
      } else {
        voiceRecognition.stop();
      }
    }
  };

  // Learning game handlers
  const startGame = (gameName: string) => {
    console.log('=== GAME START DEBUG ===');
    console.log(`Starting ${gameName} game!`);
    setCurrentGame(gameName);
    setIsOpen(false); // Close settings to show game
    console.log('=== END DEBUG ===');
  };

  return (
    <>
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="close" onClick={() => setIsOpen(false)}>
          ✖
        </button>
      </div>

      <div className="settings-section">
        <h3>🔊 Speech Settings</h3>
        <div className="setting-item">
          <label>Voice:</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI} style={{ background: '#1a1a1a' }}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        <div className="setting-item">
          <label>
            Speed: <span className="setting-value">{speechRate.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
          />
        </div>
        <div className="setting-item">
          <label>
            Pitch: <span className="setting-value">{speechPitch.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechPitch}
            onChange={(e) => updateSettings({ speechPitch: parseFloat(e.target.value) })}
          />
        </div>
        <div className="setting-item">
          <label>
            Volume: <span className="setting-value">{speechVolume.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={speechVolume}
            onChange={(e) => updateSettings({ speechVolume: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>🌍 Language Settings</h3>
        <div className="setting-item">
          <label>Language:</label>
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {languageService?.getSupportedLanguages().map((lang) => (
              <option key={lang.code} value={lang.code} style={{ background: '#1a1a1a' }}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
        <div className="setting-item">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={voiceRecognitionEnabled}
              onChange={toggleVoiceRecognition}
              disabled={!voiceRecognition?.isAvailable()}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Enable Voice Recognition
          </label>
          {!voiceRecognition?.isAvailable() && (
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Voice recognition not supported in this browser
            </small>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>🎨 Display Settings</h3>
        <div className="setting-item">
          <label>
            Grid Columns: <span className="setting-value">{gridColumns}</span>
          </label>
          <input
            type="range"
            min="2"
            max="5"
            step="1"
            value={gridColumns}
            onChange={(e) => updateSettings({ gridColumns: parseInt(e.target.value) })}
          />
        </div>
        <div className="setting-item">
          <label>
            Tile Size: <span className="setting-value">{tileScale.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={tileScale}
            onChange={(e) => updateSettings({ tileScale: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>📊 Analytics & Professional Reports</h3>
        <div className="action-buttons">
          <button className="action-btn">📈 View Usage Stats</button>
          <button className="action-btn professional">
            <span className="btn-icon">🏥</span>
            <span className="btn-text">Professional Reports</span>
          </button>
          <button className="action-btn secondary">📥 Export Analytics</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>📁 Data Management</h3>
        <div className="action-buttons">
          <button className="action-btn secondary">📥 Export Boards</button>
          <button className="action-btn secondary">📤 Import Boards</button>
          <button className="action-btn secondary">➕ Create New Board</button>
          <button className="action-btn secondary">🔄 Reset Settings</button>
        </div>
      </div>

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
    </div>
  </>
  );
}