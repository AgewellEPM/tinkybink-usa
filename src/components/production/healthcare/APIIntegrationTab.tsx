import React, { useState } from 'react';

export const APIIntegrationTab: React.FC = () => {
  const [apiKey, setApiKey] = useState('sk_live_4242424242424242');
  const [webhookUrl, setWebhookUrl] = useState('https://api.tinkybink.com/webhooks');

  const regenerateAPIKey = () => {
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    alert('API key regenerated successfully!');
  };

  const configureEpic = () => {
    alert('Epic MyChart integration configuration will open in a new window.');
    // In real implementation, this would open Epic's OAuth flow
  };

  return (
    <div id="api-tab" className="tab-content">
      <h3>API Integration Settings</h3>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h4>API Credentials</h4>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label>API Key:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="password" 
                value={apiKey}
                readOnly
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  background: '#333', 
                  border: '1px solid #555', 
                  borderRadius: '4px', 
                  color: 'white' 
                }}
              />
              <button 
                onClick={regenerateAPIKey}
                style={{ 
                  padding: '8px 16px', 
                  background: '#e74c3c', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px' 
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
          <div>
            <label>Webhook URL:</label>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
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
      
      <h4>Connected Services</h4>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '15px', 
          background: 'rgba(46, 204, 113, 0.1)', 
          borderRadius: '8px' 
        }}>
          <div>
            <strong>Stripe Payment Processing</strong>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Connected on {new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString()}
            </div>
          </div>
          <span style={{ color: '#2ecc71' }}>✓ Active</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '15px', 
          background: 'rgba(52, 152, 219, 0.1)', 
          borderRadius: '8px' 
        }}>
          <div>
            <strong>Office Ally Clearinghouse</strong>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Last sync: 2 hours ago
            </div>
          </div>
          <span style={{ color: '#3498db' }}>✓ Active</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '15px', 
          background: 'rgba(231, 76, 60, 0.1)', 
          borderRadius: '8px' 
        }}>
          <div>
            <strong>Epic MyChart Integration</strong>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Not configured
            </div>
          </div>
          <button 
            onClick={configureEpic}
            style={{ 
              padding: '6px 12px', 
              background: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Configure
          </button>
        </div>
      </div>
      
      <h4 style={{ marginTop: '20px' }}>API Usage</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '15px', 
        borderRadius: '8px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '15px', 
          textAlign: 'center' 
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12,847</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Requests Today</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>99.9%</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Uptime</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>124ms</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  );
};