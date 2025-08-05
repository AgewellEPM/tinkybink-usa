'use client';

import { useState, useEffect } from 'react';
import { predictiveCommunicationEngine } from '@/services/predictive-communication-engine';
import { advancedEyeTrackingService } from '@/services/advanced-eye-tracking-service';
import { emergencyCommunicationService } from '@/services/emergency-communication-service';
import { clinicalDecisionSupportService } from '@/services/clinical-decision-support-service';
import { familyEngagementService } from '@/services/family-engagement-service';
import { offlineSyncService } from '@/services/offline-sync-service';
import { voiceSynthesisService } from '@/services/voice-synthesis-service';
import { useAppStore } from '@/store/app-store';

/**
 * Revolutionary Features Integration Component
 * This component integrates all 5 game-changing services into the main UI
 * Making TinkyBink the world's most advanced AAC platform
 */
export function RevolutionaryFeatures() {
  const { setCurrentView } = useAppStore();
  const [isPredictiveActive, setIsPredictiveActive] = useState(false);
  const [isEyeTrackingActive, setIsEyeTrackingActive] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [gazeTarget, setGazeTarget] = useState<string | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [clinicalInsights, setClinicalInsights] = useState<any>(null);
  const [familyEngaged, setFamilyEngaged] = useState(false);

  useEffect(() => {
    // Initialize revolutionary features
    initializeRevolutionaryFeatures();
    
    // Check for emergency shortcuts
    setupEmergencyShortcuts();
    
    // Start predictive engine by default
    startPredictiveCommunication();
  }, []);

  const initializeRevolutionaryFeatures = async () => {
    console.log('🚀 Initializing Revolutionary Features...');
    
    // All services are already initialized via singletons
    // Just need to connect them to UI
    
    // Check if user has eye tracking preference
    const userPreference = localStorage.getItem('eyeTrackingEnabled');
    if (userPreference === 'true') {
      await startEyeTracking();
    }
  };

  const startPredictiveCommunication = async () => {
    setIsPredictiveActive(true);
    
    // Generate initial predictions
    const context = {
      conversationHistory: [],
      environment: {
        time_of_day: getCurrentTimeOfDay(),
        location: 'home' as const
      },
      userState: {
        energy_level: 'high' as const,
        cognitive_load: 'light' as const
      },
      currentSentence: {
        words: [],
        intent: 'comment' as const
      }
    };
    
    const result = await predictiveCommunicationEngine.generatePredictions('user123', context);
    setPredictions(result.predictions);
  };

  const startEyeTracking = async () => {
    const success = await advancedEyeTrackingService.startTracking('user123');
    setIsEyeTrackingActive(success);
    
    if (success) {
      // Monitor gaze predictions
      const checkGaze = setInterval(() => {
        const prediction = advancedEyeTrackingService.getCurrentPrediction();
        if (prediction && prediction.predicted_target.confidence > 0.7) {
          setGazeTarget(prediction.predicted_target.element_id);
        }
      }, 100);
      
      return () => clearInterval(checkGaze);
    }
  };

  const setupEmergencyShortcuts = () => {
    // Triple-tap for emergency
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;
    
    const handleTripleTap = () => {
      tapCount++;
      
      if (tapCount === 1) {
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 1000);
      } else if (tapCount === 3) {
        clearTimeout(tapTimer);
        tapCount = 0;
        // Activate emergency mode
        activateEmergencyMode('help');
      }
    };
    
    document.addEventListener('click', handleTripleTap);
    
    return () => {
      document.removeEventListener('click', handleTripleTap);
      clearTimeout(tapTimer);
    };
  };

  const activateEmergencyMode = async (type: 'medical' | 'safety' | 'help') => {
    setEmergencyMode(true);
    await emergencyCommunicationService.activateEmergency('user123', type, 8);
    
    // Speak emergency message immediately
    await voiceSynthesisService.speak({
      text: 'Emergency mode activated. Help is on the way.',
      priority: 'immediate',
      emotion: 'urgent'
    });
  };

  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  return (
    <div className="revolutionary-features">
      {/* Predictive Communication Bar */}
      {isPredictiveActive && predictions.length > 0 && (
        <div className="predictive-bar">
          <div className="predictive-title">
            <span className="ai-badge">AI</span>
            Smart Predictions
          </div>
          <div className="predictions-container">
            {predictions.slice(0, 6).map((pred, idx) => (
              <button
                key={idx}
                className={`prediction-tile ${pred.priority}`}
                onClick={async () => {
                  // Handle prediction selection
                  console.log('Selected prediction:', pred.text);
                  
                  // Speak the prediction
                  await voiceSynthesisService.speak({
                    text: pred.text,
                    priority: 'high'
                  });
                  
                  // Store offline for learning
                  await offlineSyncService.storeOffline({
                    type: 'communication',
                    data: {
                      prediction: pred,
                      selected: true,
                      timestamp: new Date()
                    },
                    userId: 'user123',
                    priority: 5
                  });
                }}
              >
                <span className="prediction-text">{pred.text}</span>
                <span className="confidence">{Math.round(pred.confidence * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Eye Tracking Indicator */}
      {isEyeTrackingActive && (
        <div className="eye-tracking-indicator">
          <div className="eye-icon">👁️</div>
          <span>Eye Tracking Active</span>
        </div>
      )}

      {/* Emergency Button (Always Visible) */}
      <button
        className="emergency-button"
        onClick={() => activateEmergencyMode('help')}
        aria-label="Emergency Help"
      >
        🚨
      </button>

      {/* Feature Control Panel */}
      <div className="feature-controls">
        <button
          className={`feature-toggle ${isPredictiveActive ? 'active' : ''}`}
          onClick={() => setIsPredictiveActive(!isPredictiveActive)}
        >
          🧠 AI Predictions
        </button>
        
        <button
          className={`feature-toggle ${isEyeTrackingActive ? 'active' : ''}`}
          onClick={async () => {
            if (isEyeTrackingActive) {
              await advancedEyeTrackingService.stopTracking('user123');
              setIsEyeTrackingActive(false);
            } else {
              await startEyeTracking();
            }
          }}
        >
          👁️ Eye Tracking
        </button>
        
        <button
          className="feature-toggle"
          onClick={() => setCurrentView('clinical')}
        >
          🏥 Clinical Insights
        </button>
        
        <button
          className="feature-toggle"
          onClick={() => setCurrentView('family')}
        >
          👨‍👩‍👧‍👦 Family Portal
        </button>
      </div>

      <style jsx>{`
        .revolutionary-features {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 100;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          backdrop-filter: blur(10px);
          padding: 0.5rem;
        }

        .predictive-bar {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .predictive-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ai-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .predictions-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .prediction-tile {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .prediction-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .prediction-tile.high {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .prediction-text {
          font-weight: 500;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .confidence {
          font-size: 0.75rem;
          color: #667eea;
          font-weight: 600;
        }

        .eye-tracking-indicator {
          position: fixed;
          top: 140px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          animation: pulse 2s infinite;
        }

        .eye-icon {
          font-size: 1.25rem;
          animation: blink 3s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.3; }
        }

        .emergency-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff4757, #c44569);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(255, 71, 87, 0.4);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emergency-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(255, 71, 87, 0.6);
        }

        .emergency-button:active {
          transform: scale(0.95);
        }

        .feature-controls {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .feature-toggle {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feature-toggle:hover {
          background: #f7fafc;
          border-color: #667eea;
        }

        .feature-toggle.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
      `}</style>
    </div>
  );
}