import React, { useState, useEffect } from 'react';

interface CustomizationSettings {
  tileSize: string;
  tileGap: number;
  borderRadius: number;
  borderWidth: number;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  showLabels: boolean;
  animationSpeed: number;
}

interface AdvancedCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: CustomizationSettings = {
  tileSize: 'medium',
  tileGap: 10,
  borderRadius: 8,
  borderWidth: 2,
  primaryColor: '#7b3ff2',
  backgroundColor: '#1a1a2e',
  textColor: '#ffffff',
  fontSize: 16,
  fontFamily: 'Arial',
  showLabels: true,
  animationSpeed: 300
};

export const AdvancedCustomization: React.FC<AdvancedCustomizationProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULT_SETTINGS);
  const [previewText, setPreviewText] = useState('Hello');

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('pecsCustomization');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof CustomizationSettings>(
    key: K,
    value: CustomizationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('pecsCustomization', JSON.stringify(settings));
    // Apply settings to document
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--text-color', settings.textColor);
    alert('Settings saved successfully!');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('pecsCustomization');
  };

  const colors = [
    '#7b3ff2', '#00b894', '#6c5ce7', '#fdcb6e', '#e17055',
    '#74b9ff', '#a29bfe', '#fd79a8', '#e84393', '#00cec9'
  ];

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>🎨 Advanced Customization</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="setting-group">
            <h3>🎨 Theme Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Primary Color:</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => updateSetting('primaryColor', color)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: color,
                        border: settings.primaryColor === color ? '3px solid white' : 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label>Background Color:</label>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>📐 Tile Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Tile Size:</label>
                <select
                  value={settings.tileSize}
                  onChange={(e) => updateSetting('tileSize', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="small">Small (80px)</option>
                  <option value="medium">Medium (100px)</option>
                  <option value="large">Large (120px)</option>
                  <option value="xlarge">Extra Large (140px)</option>
                </select>
              </div>
              <div>
                <label>Tile Gap: {settings.tileGap}px</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={settings.tileGap}
                  onChange={(e) => updateSetting('tileGap', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Border Radius: {settings.borderRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={settings.borderRadius}
                  onChange={(e) => updateSetting('borderRadius', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Border Width: {settings.borderWidth}px</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={settings.borderWidth}
                  onChange={(e) => updateSetting('borderWidth', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>📝 Text Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Font Size: {settings.fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Font Family:</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>👀 Preview</h3>
            <div style={{
              background: settings.backgroundColor,
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                width: settings.tileSize === 'small' ? '80px' : 
                       settings.tileSize === 'medium' ? '100px' : 
                       settings.tileSize === 'large' ? '120px' : '140px',
                height: settings.tileSize === 'small' ? '80px' : 
                        settings.tileSize === 'medium' ? '100px' : 
                        settings.tileSize === 'large' ? '120px' : '140px',
                background: 'rgba(255,255,255,0.1)',
                border: `${settings.borderWidth}px solid ${settings.primaryColor}`,
                borderRadius: `${settings.borderRadius}px`,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '32px' }}>😊</span>
                {settings.showLabels && (
                  <span style={{
                    color: settings.textColor,
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily
                  }}>
                    {previewText}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={saveSettings}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--success-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              💾 Save Settings
            </button>
            <button
              onClick={resetSettings}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--danger-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};