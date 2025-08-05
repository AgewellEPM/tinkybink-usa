'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { voiceSynthesisService } from '@/services/voice-synthesis-service';
import { advancedEyeTrackingService } from '@/services/advanced-eye-tracking-service';
import { multiDeviceSyncService } from '@/services/multi-device-sync-service';

/**
 * Revolutionary Onboarding Flow
 * Progressive disclosure of world-changing features
 * Makes users aware of the incredible capabilities available
 */
export default function RevolutionaryOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<'user' | 'parent' | 'teacher' | 'therapist' | null>(null);
  const [voiceSelected, setVoiceSelected] = useState(false);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
  const [emergencySetup, setEmergencySetup] = useState(false);
  const [familyInvited, setFamilyInvited] = useState(false);
  
  const steps = [
    { id: 'welcome', title: 'Welcome to the Future of Communication' },
    { id: 'user_type', title: 'Who Will Use TinkyBink?' },
    { id: 'voice_magic', title: 'Your Personal Voice' },
    { id: 'ai_power', title: 'AI That Understands You' },
    { id: 'eye_tracking', title: 'Communicate With Your Eyes' },
    { id: 'emergency', title: 'Always Safe, Always Connected' },
    { id: 'family', title: 'Bring Your Family Along' },
    { id: 'devices', title: 'Use Anywhere, Anytime' },
    { id: 'ready', title: 'Ready to Change Your Life?' }
  ];

  useEffect(() => {
    // Initialize onboarding
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    // Speak welcome message
    await voiceSynthesisService.speak({
      text: 'Welcome to TinkyBink. Let\'s set up your revolutionary communication system.',
      priority: 'high',
      emotion: 'happy'
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    // Save onboarding preferences
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('user_type', userType || 'user');
    localStorage.setItem('eyeTrackingEnabled', String(eyeTrackingEnabled));
    
    // Navigate to main app
    router.push('/');
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="welcome-step">
            <div className="hero-animation">
              <div className="floating-icons">
                <span className="icon brain">🧠</span>
                <span className="icon eye">👁️</span>
                <span className="icon voice">🎤</span>
                <span className="icon heart">❤️</span>
                <span className="icon emergency">🚨</span>
              </div>
            </div>
            <h1>Welcome to TinkyBink</h1>
            <p className="hero-text">
              The world&apos;s first truly intelligent AAC platform that understands you
            </p>
            <div className="feature-highlights">
              <div className="highlight">
                <span className="icon">🧠</span>
                <span>AI that predicts what you want to say</span>
              </div>
              <div className="highlight">
                <span className="icon">👁️</span>
                <span>Control with just your eyes</span>
              </div>
              <div className="highlight">
                <span className="icon">🎤</span>
                <span>Natural voice that sounds like you</span>
              </div>
              <div className="highlight">
                <span className="icon">🚨</span>
                <span>Emergency help always one tap away</span>
              </div>
            </div>
          </div>
        );

      case 'user_type':
        return (
          <div className="user-type-step">
            <h2>Who will be using TinkyBink?</h2>
            <p>This helps us personalize your experience</p>
            <div className="user-type-grid">
              <button
                className={`user-type-option ${userType === 'user' ? 'selected' : ''}`}
                onClick={() => setUserType('user')}
              >
                <span className="icon">🗣️</span>
                <h3>I&apos;ll use it myself</h3>
                <p>I need AAC to communicate</p>
              </button>
              <button
                className={`user-type-option ${userType === 'parent' ? 'selected' : ''}`}
                onClick={() => setUserType('parent')}
              >
                <span className="icon">👨‍👩‍👧</span>
                <h3>Parent/Guardian</h3>
                <p>Supporting my child</p>
              </button>
              <button
                className={`user-type-option ${userType === 'teacher' ? 'selected' : ''}`}
                onClick={() => setUserType('teacher')}
              >
                <span className="icon">👩‍🏫</span>
                <h3>Teacher</h3>
                <p>Supporting students</p>
              </button>
              <button
                className={`user-type-option ${userType === 'therapist' ? 'selected' : ''}`}
                onClick={() => setUserType('therapist')}
              >
                <span className="icon">🏥</span>
                <h3>Speech Therapist</h3>
                <p>Professional use</p>
              </button>
            </div>
          </div>
        );

      case 'voice_magic':
        return (
          <div className="voice-step">
            <h2>🎤 Your Voice, Your Way</h2>
            <p>Choose a voice that represents you</p>
            <div className="voice-preview">
              <button
                className="voice-option"
                onClick={async () => {
                  await voiceSynthesisService.previewVoice('default', 'Hello! I sound friendly and clear.');
                  setVoiceSelected(true);
                }}
              >
                <span className="voice-icon">🎵</span>
                <h3>Natural Voice</h3>
                <p>Clear and friendly</p>
              </button>
              <button
                className="voice-option"
                onClick={async () => {
                  await voiceSynthesisService.previewVoice('young', 'Hi! I sound young and energetic!');
                  setVoiceSelected(true);
                }}
              >
                <span className="voice-icon">🌟</span>
                <h3>Young Voice</h3>
                <p>Energetic and playful</p>
              </button>
              <button
                className="voice-option premium"
                onClick={async () => {
                  await voiceSynthesisService.previewVoice('premium', 'I use advanced AI for the most natural speech.');
                  setVoiceSelected(true);
                }}
              >
                <span className="voice-icon">✨</span>
                <h3>Premium AI Voice</h3>
                <p>Most natural and expressive</p>
                <span className="badge">Premium</span>
              </button>
            </div>
            <div className="voice-features">
              <p className="feature-note">✨ Your voice adapts to emotions and context automatically</p>
            </div>
          </div>
        );

      case 'ai_power':
        return (
          <div className="ai-step">
            <h2>🧠 AI That Truly Understands You</h2>
            <p>Watch how our AI predicts what you want to say</p>
            <div className="ai-demo">
              <div className="demo-scenario">
                <h3>Scenario: Morning at home</h3>
                <div className="prediction-demo">
                  <div className="context-info">
                    <span>📍 Location: Home</span>
                    <span>⏰ Time: 8:00 AM</span>
                    <span>👥 With: Mom</span>
                  </div>
                  <div className="predictions">
                    <div className="prediction high">Good morning</div>
                    <div className="prediction high">I&apos;m hungry</div>
                    <div className="prediction medium">What&apos;s for breakfast?</div>
                    <div className="prediction medium">I love you</div>
                  </div>
                </div>
              </div>
              <div className="ai-features">
                <div className="feature">
                  <span className="icon">🎯</span>
                  <span>Learns from your successful communications</span>
                </div>
                <div className="feature">
                  <span className="icon">🌍</span>
                  <span>Adapts to your environment and people</span>
                </div>
                <div className="feature">
                  <span className="icon">💭</span>
                  <span>Predicts based on context and emotions</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'eye_tracking':
        return (
          <div className="eye-tracking-step">
            <h2>👁️ Communicate With Just Your Eyes</h2>
            <p>Perfect for when touch isn&apos;t possible</p>
            <div className="eye-tracking-demo">
              <div className="demo-visual">
                <div className="eye-cursor"></div>
                <div className="gaze-targets">
                  <div className="target">Look here</div>
                  <div className="target">Or here</div>
                  <div className="target">Select this</div>
                </div>
              </div>
              <div className="eye-features">
                <div className="feature">
                  <h3>🎯 Smart Targeting</h3>
                  <p>AI predicts where you want to look</p>
                </div>
                <div className="feature">
                  <h3>😴 Fatigue Detection</h3>
                  <p>Automatically adjusts when you&apos;re tired</p>
                </div>
                <div className="feature">
                  <h3>📱 Works on Tablets</h3>
                  <p>Including Amazon Fire tablets</p>
                </div>
              </div>
              <button
                className="try-eye-tracking"
                onClick={async () => {
                  const success = await advancedEyeTrackingService.startTracking('demo_user');
                  setEyeTrackingEnabled(success);
                  if (success) {
                    await voiceSynthesisService.speak({
                      text: 'Eye tracking activated. Look at any button to select it.',
                      priority: 'high'
                    });
                  }
                }}
              >
                Try Eye Tracking Demo
              </button>
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="emergency-step">
            <h2>🚨 Always Safe, Always Connected</h2>
            <p>Help is always just one tap away</p>
            <div className="emergency-features">
              <div className="emergency-demo">
                <button className="emergency-button-demo">
                  🚨 EMERGENCY
                </button>
                <p className="demo-note">Tap for instant help</p>
              </div>
              <div className="emergency-capabilities">
                <div className="capability">
                  <span className="icon">📞</span>
                  <h3>One-Touch 911</h3>
                  <p>Automatically shares your medical info and location</p>
                </div>
                <div className="capability">
                  <span className="icon">👨‍👩‍👧</span>
                  <h3>Family Alerts</h3>
                  <p>Instantly notifies your emergency contacts</p>
                </div>
                <div className="capability">
                  <span className="icon">🏥</span>
                  <h3>Medical Info</h3>
                  <p>Shares allergies, medications, and conditions</p>
                </div>
                <div className="capability">
                  <span className="icon">📍</span>
                  <h3>GPS Location</h3>
                  <p>First responders know exactly where you are</p>
                </div>
              </div>
              <button
                className="setup-emergency"
                onClick={() => setEmergencySetup(true)}
              >
                Set Up Emergency Contacts
              </button>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="family-step">
            <h2>👨‍👩‍👧‍👦 Bring Your Whole Family Along</h2>
            <p>Everyone learns to communicate better together</p>
            <div className="family-features">
              <div className="family-grid">
                <div className="family-member">
                  <span className="icon">👨‍👩‍👧</span>
                  <h3>Parents</h3>
                  <p>Learn AAC strategies and track progress</p>
                </div>
                <div className="family-member">
                  <span className="icon">👦👧</span>
                  <h3>Siblings</h3>
                  <p>Fun games and activities to support communication</p>
                </div>
                <div className="family-member">
                  <span className="icon">👴👵</span>
                  <h3>Grandparents</h3>
                  <p>Simple training to stay connected</p>
                </div>
                <div className="family-member">
                  <span className="icon">🏫</span>
                  <h3>Teachers</h3>
                  <p>Classroom strategies and progress reports</p>
                </div>
              </div>
              <div className="family-benefits">
                <div className="benefit">
                  <span className="check">✅</span>
                  <span>Personalized training for each family member</span>
                </div>
                <div className="benefit">
                  <span className="check">✅</span>
                  <span>Track progress and celebrate achievements</span>
                </div>
                <div className="benefit">
                  <span className="check">✅</span>
                  <span>Connect with other families for support</span>
                </div>
              </div>
              <button
                className="invite-family"
                onClick={() => setFamilyInvited(true)}
              >
                Invite Family Members
              </button>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div className="devices-step">
            <h2>📱 Use Anywhere, On Any Device</h2>
            <p>Seamless communication across all your devices</p>
            <div className="device-ecosystem">
              <div className="device-visual">
                <div className="device tablet">
                  <span className="icon">📱</span>
                  <p>Tablet</p>
                </div>
                <div className="device phone">
                  <span className="icon">📱</span>
                  <p>Phone</p>
                </div>
                <div className="device watch">
                  <span className="icon">⌚</span>
                  <p>Smart Watch</p>
                </div>
                <div className="device speaker">
                  <span className="icon">🔊</span>
                  <p>Smart Speaker</p>
                </div>
              </div>
              <div className="sync-features">
                <div className="sync-feature">
                  <span className="icon">🔄</span>
                  <h3>Real-Time Sync</h3>
                  <p>Start on tablet, continue on phone</p>
                </div>
                <div className="sync-feature">
                  <span className="icon">📴</span>
                  <h3>Works Offline</h3>
                  <p>No internet? No problem!</p>
                </div>
                <div className="sync-feature">
                  <span className="icon">🏠</span>
                  <h3>Smart Home</h3>
                  <p>Control lights, TV, and more</p>
                </div>
              </div>
              <div className="device-status">
                <p>Detected devices: {multiDeviceSyncService.getConnectedDevices().length}</p>
              </div>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="ready-step">
            <h2>🚀 Ready to Change Your Life?</h2>
            <p>You&apos;re all set with the world&apos;s most advanced AAC platform</p>
            <div className="setup-summary">
              <div className="summary-item completed">
                <span className="check">✅</span>
                <span>AI predictions ready to learn from you</span>
              </div>
              <div className="summary-item completed">
                <span className="check">✅</span>
                <span>Your personal voice configured</span>
              </div>
              {eyeTrackingEnabled && (
                <div className="summary-item completed">
                  <span className="check">✅</span>
                  <span>Eye tracking calibrated</span>
                </div>
              )}
              {emergencySetup && (
                <div className="summary-item completed">
                  <span className="check">✅</span>
                  <span>Emergency contacts ready</span>
                </div>
              )}
              {familyInvited && (
                <div className="summary-item completed">
                  <span className="check">✅</span>
                  <span>Family members invited</span>
                </div>
              )}
            </div>
            <div className="inspiration">
              <blockquote>
                &quot;The iPhone moment for AAC has arrived.&quot; You&apos;re not just getting a communication app - 
                you&apos;re getting a revolutionary platform that will transform how the world thinks about communication.&quot;
              </blockquote>
              <p className="author">- The TinkyBink Team</p>
            </div>
            <button
              className="start-journey"
              onClick={completeOnboarding}
            >
              Start Your Communication Journey
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="step-content">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="navigation">
          {currentStep > 0 && (
            <button className="nav-button back" onClick={handleBack}>
              Back
            </button>
          )}
          <button 
            className="nav-button next" 
            onClick={handleNext}
            disabled={
              (steps[currentStep].id === 'user_type' && !userType) ||
              (steps[currentStep].id === 'voice_magic' && !voiceSelected)
            }
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .onboarding-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .onboarding-content {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 900px;
          width: 100%;
          overflow: hidden;
        }

        .progress-bar {
          height: 6px;
          background: #e2e8f0;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .step-content {
          padding: 3rem;
          min-height: 500px;
        }

        h1, h2 {
          color: #2d3748;
          margin-bottom: 1rem;
          text-align: center;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 800;
        }

        h2 {
          font-size: 2rem;
          font-weight: 700;
        }

        p {
          color: #4a5568;
          text-align: center;
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }

        .hero-text {
          font-size: 1.25rem;
          color: #667eea;
          font-weight: 600;
        }

        /* Welcome step styles */
        .hero-animation {
          position: relative;
          height: 150px;
          margin-bottom: 2rem;
        }

        .floating-icons {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 3rem;
        }

        .floating-icons .icon {
          animation: float 3s ease-in-out infinite;
        }

        .floating-icons .icon:nth-child(2) { animation-delay: 0.5s; }
        .floating-icons .icon:nth-child(3) { animation-delay: 1s; }
        .floating-icons .icon:nth-child(4) { animation-delay: 1.5s; }
        .floating-icons .icon:nth-child(5) { animation-delay: 2s; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .feature-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }

        .highlight {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          font-size: 0.95rem;
          color: #4a5568;
        }

        .highlight .icon {
          font-size: 1.5rem;
        }

        /* User type step */
        .user-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }

        .user-type-option {
          padding: 2rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .user-type-option:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .user-type-option.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .user-type-option .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .user-type-option h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .user-type-option p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        /* Voice step */
        .voice-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 2rem 0;
        }

        .voice-option {
          padding: 1.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          position: relative;
        }

        .voice-option:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .voice-option.premium {
          border-color: #f6ad55;
          background: linear-gradient(135deg, rgba(246, 173, 85, 0.1) 0%, rgba(237, 137, 54, 0.1) 100%);
        }

        .voice-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 1rem;
        }

        .voice-option h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .voice-option p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .feature-note {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.95rem;
          text-align: center;
        }

        /* AI step */
        .demo-scenario {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .demo-scenario h3 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }

        .context-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .context-info span {
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .predictions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .prediction {
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .prediction.high {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .prediction.medium {
          background: white;
          border: 2px solid #667eea;
          color: #667eea;
        }

        .prediction:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
        }

        .ai-features {
          display: grid;
          gap: 1rem;
        }

        .ai-features .feature {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .ai-features .feature .icon {
          font-size: 1.5rem;
        }

        /* Eye tracking step */
        .eye-tracking-demo {
          margin: 2rem 0;
        }

        .demo-visual {
          background: #f7fafc;
          padding: 3rem;
          border-radius: 12px;
          position: relative;
          margin-bottom: 2rem;
          height: 200px;
        }

        .eye-cursor {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: radial-gradient(circle, #667eea 0%, transparent 70%);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: gaze-move 5s ease-in-out infinite;
        }

        @keyframes gaze-move {
          0%, 100% { top: 50%; left: 20%; }
          33% { top: 30%; left: 50%; }
          66% { top: 70%; left: 80%; }
        }

        .gaze-targets {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 100%;
        }

        .target {
          padding: 1rem 1.5rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 500;
        }

        .eye-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .eye-features .feature {
          text-align: center;
          padding: 1rem;
        }

        .eye-features h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .eye-features p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .try-eye-tracking {
          display: block;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .try-eye-tracking:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        /* Emergency step */
        .emergency-demo {
          text-align: center;
          margin: 2rem 0;
        }

        .emergency-button-demo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff4757, #c44569);
          border: none;
          color: white;
          font-size: 3rem;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(255, 71, 87, 0.4);
          animation: emergency-pulse 2s infinite;
        }

        @keyframes emergency-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .demo-note {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 1rem;
        }

        .emergency-capabilities {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .capability {
          text-align: center;
        }

        .capability .icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .capability h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .capability p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .setup-emergency {
          display: block;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #ff4757, #c44569);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .setup-emergency:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
        }

        /* Family step */
        .family-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .family-member {
          text-align: center;
          padding: 1.5rem 1rem;
          background: #f7fafc;
          border-radius: 12px;
        }

        .family-member .icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .family-member h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .family-member p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .family-benefits {
          margin-bottom: 2rem;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
        }

        .benefit .check {
          color: #48bb78;
          font-size: 1.25rem;
        }

        .invite-family {
          display: block;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invite-family:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        /* Devices step */
        .device-visual {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin: 2rem 0;
          flex-wrap: wrap;
        }

        .device {
          text-align: center;
          animation: device-float 3s ease-in-out infinite;
        }

        .device:nth-child(2) { animation-delay: 0.5s; }
        .device:nth-child(3) { animation-delay: 1s; }
        .device:nth-child(4) { animation-delay: 1.5s; }

        @keyframes device-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .device .icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .device p {
          font-size: 0.875rem;
          margin: 0;
        }

        .sync-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 2rem 0;
        }

        .sync-feature {
          text-align: center;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 12px;
        }

        .sync-feature .icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .sync-feature h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .sync-feature p {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .device-status {
          text-align: center;
          padding: 1rem;
          background: #e6fffa;
          border-radius: 8px;
          color: #285e61;
          font-weight: 500;
        }

        /* Ready step */
        .setup-summary {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          font-size: 1.125rem;
        }

        .summary-item .check {
          color: #48bb78;
          font-size: 1.5rem;
        }

        .inspiration {
          margin: 2rem 0;
          text-align: center;
        }

        blockquote {
          font-size: 1.25rem;
          font-style: italic;
          color: #4a5568;
          margin: 1rem 0;
          padding: 0 2rem;
        }

        .author {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.5rem;
        }

        .start-journey {
          display: block;
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 2rem;
        }

        .start-journey:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        /* Navigation */
        .navigation {
          display: flex;
          justify-content: space-between;
          padding: 2rem 3rem;
          border-top: 1px solid #e2e8f0;
        }

        .nav-button {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-button.back {
          background: #e2e8f0;
          color: #4a5568;
        }

        .nav-button.back:hover {
          background: #cbd5e0;
        }

        .nav-button.next {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .nav-button.next:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}