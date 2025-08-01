import React, { useState } from 'react';

export const WhiteLabelTab: React.FC = () => {
  const [brandName, setBrandName] = useState('TinkyBink Therapy Platform');
  const [primaryColor, setPrimaryColor] = useState('#7B3FF2');
  const [secondaryColor, setSecondaryColor] = useState('#FF006E');
  const [logoUrl, setLogoUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  
  const [features, setFeatures] = useState({
    customEmailTemplates: true,
    removeBranding: true,
    customMobileApp: false,
    apiWhiteLabeling: false
  });

  const verifyDomain = () => {
    if (!customDomain) {
      alert('Please enter a custom domain first.');
      return;
    }
    
    alert(`Verifying domain: ${customDomain}...\n\nPlease add the following DNS records:\n\nA Record: @ -> 104.21.32.158\nCNAME: www -> ${customDomain}\n\nSSL certificate will be issued automatically via Let's Encrypt.`);
    
    // Simulate verification process
    setTimeout(() => {
      setDomainVerified(true);
      alert('✅ Domain verified successfully! SSL certificate will be issued within 24-48 hours.');
    }, 3000);
  };

  const previewWhiteLabel = () => {
    alert(`Previewing white label configuration:\n\nBrand: ${brandName}\nPrimary Color: ${primaryColor}\nSecondary Color: ${secondaryColor}\nDomain: ${customDomain || 'Not configured'}\n\nA preview window would open in a real implementation.`);
  };

  const saveWhiteLabel = () => {
    const config = {
      brandName,
      primaryColor,
      secondaryColor,
      logoUrl,
      customDomain,
      domainVerified,
      features,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('whiteLabelConfig', JSON.stringify(config));
    alert('✅ White label configuration saved successfully!');
  };

  const handleFeatureChange = (feature: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <div id="whitelabel-tab" className="tab-content">
      <h3>White Label Configuration</h3>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h4>Brand Customization</h4>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label>Brand Name:</label>
            <input 
              type="text" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#333', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                color: 'white' 
              }}
            />
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '15px' 
          }}>
            <div>
              <label>Primary Color:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ 
                    width: '60px', 
                    height: '36px', 
                    background: 'transparent', 
                    border: '1px solid #555', 
                    borderRadius: '4px' 
                  }}
                />
                <input 
                  type="text" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    background: '#333', 
                    border: '1px solid #555', 
                    borderRadius: '4px', 
                    color: 'white' 
                  }}
                />
              </div>
            </div>
            <div>
              <label>Secondary Color:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="color" 
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ 
                    width: '60px', 
                    height: '36px', 
                    background: 'transparent', 
                    border: '1px solid #555', 
                    borderRadius: '4px' 
                  }}
                />
                <input 
                  type="text" 
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    background: '#333', 
                    border: '1px solid #555', 
                    borderRadius: '4px', 
                    color: 'white' 
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <label>Logo URL:</label>
            <input 
              type="text" 
              placeholder="https://yourclinic.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#333', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                color: 'white' 
              }}
            />
          </div>
        </div>
      </div>
      
      <h4>Custom Domain Configuration</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label>Custom Domain:</label>
            <input 
              type="text" 
              placeholder="therapy.yourclinic.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#333', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                color: 'white' 
              }}
            />
          </div>
          <div>
            <label>Domain Status:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                width: '10px', 
                height: '10px', 
                background: domainVerified ? '#2ecc71' : '#e74c3c', 
                borderRadius: '50%' 
              }}></span>
              <span>{domainVerified ? 'Verified' : 'Not Configured'}</span>
              <button 
                onClick={verifyDomain}
                style={{ 
                  marginLeft: 'auto', 
                  padding: '6px 12px', 
                  background: '#3498db', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Verify Domain
              </button>
            </div>
          </div>
        </div>
        
        <h5 style={{ marginTop: '20px', marginBottom: '10px' }}>DNS Records Required:</h5>
        <div style={{ 
          background: '#1a1a1a', 
          padding: '15px', 
          borderRadius: '4px', 
          fontFamily: 'monospace', 
          fontSize: '12px' 
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>A Record:</strong><br/>
            Name: @ or therapy<br/>
            Value: 104.21.32.158<br/>
            TTL: Auto
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>CNAME Record:</strong><br/>
            Name: www<br/>
            Value: {customDomain || 'therapy.yourclinic.com'}<br/>
            TTL: Auto
          </div>
          <div>
            <strong>TXT Record (for SSL):</strong><br/>
            Name: _acme-challenge<br/>
            Value: <span style={{ color: '#f1c40f' }}>Will be provided after domain verification</span><br/>
            TTL: Auto
          </div>
        </div>
        
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          background: 'rgba(52, 152, 219, 0.1)', 
          borderRadius: '8px' 
        }}>
          <strong>SSL Certificate:</strong> Automatic via Let's Encrypt<br/>
          <strong>Propagation Time:</strong> 24-48 hours<br/>
          <strong>Support:</strong> <a href="#" style={{ color: '#3498db' }}>View setup guide</a> | <a href="#" style={{ color: '#3498db' }}>Contact support</a>
        </div>
      </div>
      
      <h4>White Label Features</h4>
      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={features.customEmailTemplates}
            onChange={() => handleFeatureChange('customEmailTemplates')}
          /> 
          Custom email templates
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={features.removeBranding}
            onChange={() => handleFeatureChange('removeBranding')}
          /> 
          Remove TinkyBink branding
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={features.customMobileApp}
            onChange={() => handleFeatureChange('customMobileApp')}
          /> 
          Custom mobile app
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={features.apiWhiteLabeling}
            onChange={() => handleFeatureChange('apiWhiteLabeling')}
          /> 
          API white labeling
        </label>
      </div>
      
      <div className="action-buttons">
        <button className="action-btn" onClick={previewWhiteLabel}>
          👁️ Preview Changes
        </button>
        <button className="action-btn" onClick={saveWhiteLabel}>
          💾 Save Configuration
        </button>
      </div>
    </div>
  );
};