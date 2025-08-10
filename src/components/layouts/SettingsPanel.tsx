'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { getLanguageService, getVoiceRecognitionService, getEducationalGamesService, getMemoryTrainingService, getSkillAssessmentService } from '@/modules/module-system';
import { AccountCloudSection } from '@/components/settings/sections/AccountCloudSection';
import { LocationContextSection } from '@/components/settings/sections/LocationContextSection';
import { DataManagementSection } from '@/components/settings/sections/DataManagementSection';
import { AnalyticsSection } from '@/components/settings/sections/AnalyticsSection';
import { LearningGamesSection } from '@/components/settings/sections/LearningGamesSection';
import { PECSFeaturesSection } from '@/components/settings/sections/PECSFeaturesSection';
import { BillingSection } from '@/components/settings/sections/BillingSection';
import { ProductionManagementSection } from '@/components/settings/sections/ProductionManagementSection';
import { AccessibilitySection } from '@/components/settings/sections/AccessibilitySection';
import { SubscriptionSection } from '@/components/settings/SubscriptionSection';
import { advancedEyeTrackingService } from '@/services/advanced-eye-tracking-service';

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
    setCurrentView,
    isPredictiveActive,
    isEyeTrackingActive,
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
        <div className="setting-item">
          <label>
            Text Size: <span className="setting-value">1.0</span>
          </label>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={1.0}
            onChange={(e) => {
              // TODO: Implement text size adjustment
              console.log('Text size:', e.target.value);
            }}
          />
        </div>
      </div>

      {/* Revolutionary Features Section */}
      <div className="settings-section">
        <h3>🚀 Revolutionary Features</h3>
        
        <div className="setting-item">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isPredictiveActive}
              onChange={(e) => updateSettings({ isPredictiveActive: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            🧠 AI Predictions
          </label>
          <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
            Smart word and sentence suggestions
          </small>
        </div>

        <div className="setting-item">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isEyeTrackingActive}
              onChange={async (e) => {
                const enabled = e.target.checked;
                updateSettings({ isEyeTrackingActive: enabled });
                if (enabled) {
                  await advancedEyeTrackingService.startTracking('user123');
                } else {
                  await advancedEyeTrackingService.stopTracking('user123');
                }
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            👁️ Eye Tracking
          </label>
          <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
            Control with eye movements
          </small>
        </div>

        <div className="setting-item">
          <button
            onClick={() => setCurrentView('clinical')}
            className="feature-button"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '8px'
            }}
          >
            🏥 Clinical Insights
          </button>
        </div>

        <div className="setting-item">
          <button
            onClick={() => setCurrentView('family')}
            className="feature-button"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '8px'
            }}
          >
            👨‍👩‍👧‍👦 Family Portal
          </button>
        </div>

        <div className="setting-item">
          <button
            onClick={() => setCurrentView('calendar')}
            className="feature-button"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '8px'
            }}
          >
            📅 Calendar Sync
          </button>
        </div>
      </div>

      <AccountCloudSection />
      <SubscriptionSection />
      <AnalyticsSection />
      <LocationContextSection />
      <DataManagementSection />
      <LearningGamesSection />
      <PECSFeaturesSection />
      <BillingSection />
      <ProductionManagementSection />
      <AccessibilitySection />
    </div>
  </>
  );
}