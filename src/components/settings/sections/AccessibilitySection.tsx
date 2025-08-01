'use client';

import { useState, useEffect } from 'react';
import { getAccessibilityService } from '@/modules/module-system';

export function AccessibilitySection() {
  const [switchScanningEnabled, setSwitchScanningEnabled] = useState(false);
  const [accessibilityService, setAccessibilityService] = useState<ReturnType<typeof getAccessibilityService> | null>(null);
  const [scanSettings, setScanSettings] = useState({
    scanSpeed: 2000,
    highlightColor: '#FFD93D',
    audioFeedback: true,
    autoStart: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const service = getAccessibilityService();
      setAccessibilityService(service);
      
      // Get current settings
      const settings = service.getSettings();
      setSwitchScanningEnabled(typeof settings.switchScanning === 'object' ? settings.switchScanning.enabled || false : settings.switchScanning || false);
      if (settings.switchScanning) {
        setScanSettings({
          scanSpeed: settings.switchScanning.scanSpeed || 2000,
          highlightColor: settings.switchScanning.highlightColor || '#FFD93D',
          audioFeedback: settings.switchScanning.audioFeedback !== false,
          autoStart: settings.switchScanning.autoStart || false
        });
      }
    }
  }, []);

  const toggleSwitchScanning = () => {
    if (!accessibilityService) return;
    
    const newState = !switchScanningEnabled;
    setSwitchScanningEnabled(newState);
    
    if (newState) {
      accessibilityService.enableFeature('switchScanning');
      // Configure switch scanning
      accessibilityService.configureSwitchScanning(scanSettings);
    } else {
      accessibilityService.disableFeature('switchScanning');
    }
  };

  const updateScanSpeed = (speed: number) => {
    setScanSettings(prev => ({ ...prev, scanSpeed: speed }));
    if (switchScanningEnabled && accessibilityService) {
      accessibilityService.configureSwitchScanning({ scanSpeed: speed });
    }
  };

  const toggleAudioFeedback = () => {
    const newState = !scanSettings.audioFeedback;
    setScanSettings(prev => ({ ...prev, audioFeedback: newState }));
    if (switchScanningEnabled && accessibilityService) {
      accessibilityService.configureSwitchScanning({ audioFeedback: newState });
    }
  };

  const openMoreAccessibilityOptions = () => {
    alert('♿ More Accessibility Features\n\n' +
      'Available options:\n' +
      '• Eye tracking support\n' +
      '• Head tracking navigation\n' +
      '• Voice navigation\n' +
      '• High contrast mode\n' +
      '• Large cursor/touch targets\n' +
      '• Simplified UI mode\n' +
      '• Keyboard-only navigation\n' +
      '• Screen reader optimization\n' +
      '• Dwell clicking\n' +
      '• Custom gestures'
    );
  };

  return (
    <div className="settings-section">
      <h3>♿ Accessibility Features</h3>
      
      <div className="setting-item">
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🎯 Switch Scanning</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={switchScanningEnabled}
              onChange={toggleSwitchScanning}
            />
            <span className="slider round"></span>
          </label>
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Navigate with switches or keyboard
        </div>
      </div>
      
      {switchScanningEnabled && (
        <div style={{ marginTop: '15px', paddingLeft: '20px' }}>
          <div className="setting-item">
            <label>
              Scan Speed: <span className="setting-value">{scanSettings.scanSpeed}ms</span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={scanSettings.scanSpeed}
              onChange={(e) => updateScanSpeed(parseInt(e.target.value))}
            />
          </div>
          
          <div className="setting-item">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={scanSettings.audioFeedback}
                onChange={toggleAudioFeedback}
                style={{ width: '18px', height: '18px' }}
              />
              Audio Feedback
            </label>
          </div>
        </div>
      )}
      
      <div className="action-buttons" style={{ marginTop: '15px' }}>
        <button 
          className="action-btn secondary" 
          onClick={openMoreAccessibilityOptions}
        >
          ⚙️ More Options
        </button>
      </div>
    </div>
  );
}