'use client';

import React, { useState, useEffect } from 'react';
import { calendarIntegrationService } from '../services/calendar-integration-service';

interface CalendarProvider {
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'exchange' | 'caldav';
  enabled: boolean;
  icon: string;
  description: string;
}

interface SyncStatus {
  provider: string;
  lastSync: Date;
  status: 'success' | 'error' | 'pending';
  syncedAppointments: number;
  errors: string[];
}

export default function CalendarIntegrationPanel() {
  const [providers, setProviders] = useState<CalendarProvider[]>([
    {
      name: 'Google Calendar',
      type: 'google',
      enabled: false,
      icon: '🟦',
      description: 'Sync with your Google Calendar and Gmail'
    },
    {
      name: 'Outlook Calendar',
      type: 'outlook',
      enabled: false,
      icon: '🟦',
      description: 'Sync with Microsoft Outlook and Office 365'
    },
    {
      name: 'Apple Calendar',
      type: 'apple',
      enabled: false,
      icon: '🍎',
      description: 'Sync with iCloud Calendar (requires app password)'
    }
  ]);

  const [syncStatuses, setSyncStatuses] = useState<Map<string, SyncStatus>>(new Map());
  const [showConnectionModal, setShowConnectionModal] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    google: { clientId: '', clientSecret: '' },
    outlook: { clientId: '', clientSecret: '', tenantId: 'common' },
    apple: { username: '', password: '', serverUrl: 'https://caldav.icloud.com' }
  });

  useEffect(() => {
    loadProviderStatus();
    loadSyncStatuses();
  }, []);

  const loadProviderStatus = async () => {
    // Check which providers are currently connected
    const statuses = calendarIntegrationService.getSyncStatuses();
    
    setProviders(prev => prev.map(provider => ({
      ...provider,
      enabled: statuses.has(provider.type) && 
               statuses.get(provider.type)?.status !== 'error'
    })));
  };

  const loadSyncStatuses = () => {
    const statuses = calendarIntegrationService.getSyncStatuses();
    setSyncStatuses(statuses);
  };

  const handleConnectProvider = async (providerType: string) => {
    setIsConnecting(true);
    
    try {
      switch (providerType) {
        case 'google':
          await connectGoogleCalendar();
          break;
        case 'outlook':
          await connectOutlookCalendar();
          break;
        case 'apple':
          await connectAppleCalendar();
          break;
      }
      
      await loadProviderStatus();
      setShowConnectionModal(null);
      
    } catch (error) {
      console.error(`Failed to connect ${providerType}:`, error);
      alert(`Failed to connect ${providerType} calendar. Please check your credentials.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectGoogleCalendar = async () => {
    const { clientId, clientSecret } = connectionForm.google;
    if (!clientId || !clientSecret) {
      throw new Error('Client ID and Client Secret are required');
    }

    const { authUrl } = await calendarIntegrationService.connectGoogleCalendar(
      clientId,
      clientSecret
    );

    // Open OAuth window
    window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    // Listen for OAuth completion
    window.addEventListener('message', async (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'google-auth-success') {
        const success = await calendarIntegrationService.completeGoogleAuth(event.data.code);
        if (success) {
          alert('✅ Google Calendar connected successfully!');
        }
      }
    });
  };

  const connectOutlookCalendar = async () => {
    const { clientId, clientSecret, tenantId } = connectionForm.outlook;
    if (!clientId || !clientSecret) {
      throw new Error('Client ID and Client Secret are required');
    }

    const { authUrl } = await calendarIntegrationService.connectOutlookCalendar(
      clientId,
      clientSecret,
      tenantId
    );

    window.open(authUrl, 'outlook-auth', 'width=500,height=600');
    
    window.addEventListener('message', async (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'outlook-auth-success') {
        alert('✅ Outlook Calendar connected successfully!');
      }
    });
  };

  const connectAppleCalendar = async () => {
    const { username, password, serverUrl } = connectionForm.apple;
    if (!username || !password) {
      throw new Error('Username and App Password are required');
    }

    const success = await calendarIntegrationService.connectAppleCalendar(
      username,
      password,
      serverUrl
    );

    if (success) {
      alert('✅ Apple Calendar connected successfully!');
    } else {
      throw new Error('Failed to connect to Apple Calendar');
    }
  };

  const handleDisconnectProvider = async (providerType: string) => {
    if (confirm(`Are you sure you want to disconnect ${providerType} calendar?`)) {
      // Implementation for disconnecting provider
      console.log(`Disconnecting ${providerType}`);
      await loadProviderStatus();
    }
  };

  const handleManualSync = async () => {
    console.log('🔄 Starting manual sync...');
    const results = await calendarIntegrationService.triggerFullSync();
    setSyncStatuses(results);
    
    const totalSynced = Array.from(results.values())
      .reduce((sum, status) => sum + status.syncedAppointments, 0);
    
    alert(`✅ Sync completed! ${totalSynced} appointments synced.`);
  };

  const formatLastSync = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const ConnectionModal = ({ providerType }: { providerType: string }) => {
    const provider = providers.find(p => p.type === providerType);
    if (!provider) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowConnectionModal(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{provider.icon} Connect {provider.name}</h3>
            <button onClick={() => setShowConnectionModal(null)} className="close-button">×</button>
          </div>

          <div className="modal-body">
            <p className="connection-description">{provider.description}</p>

            {providerType === 'google' && (
              <div className="connection-form">
                <div className="setup-instructions">
                  <h4>📋 Setup Instructions:</h4>
                  <ol>
                    <li>Go to <a href="https://console.developers.google.com" target="_blank">Google Cloud Console</a></li>
                    <li>Create a new project or select existing one</li>
                    <li>Enable the Google Calendar API</li>
                    <li>Create OAuth 2.0 credentials</li>
                    <li>Add <code>http://localhost:3456/auth/google/callback</code> as redirect URI</li>
                    <li>Copy your Client ID and Client Secret below</li>
                  </ol>
                </div>

                <div className="form-group">
                  <label>Client ID</label>
                  <input
                    type="text"
                    value={connectionForm.google.clientId}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      google: { ...connectionForm.google, clientId: e.target.value }
                    })}
                    placeholder="123456789-abc123.googleusercontent.com"
                  />
                </div>

                <div className="form-group">
                  <label>Client Secret</label>
                  <input
                    type="password"
                    value={connectionForm.google.clientSecret}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      google: { ...connectionForm.google, clientSecret: e.target.value }
                    })}
                    placeholder="GOCSPX-abc123def456"
                  />
                </div>
              </div>
            )}

            {providerType === 'outlook' && (
              <div className="connection-form">
                <div className="setup-instructions">
                  <h4>📋 Setup Instructions:</h4>
                  <ol>
                    <li>Go to <a href="https://portal.azure.com" target="_blank">Azure Portal</a></li>
                    <li>Navigate to App registrations</li>
                    <li>Create a new registration</li>
                    <li>Add <code>http://localhost:3456/auth/outlook/callback</code> as redirect URI</li>
                    <li>Add Calendar.ReadWrite permission</li>
                    <li>Copy your Application (client) ID and generate a client secret</li>
                  </ol>
                </div>

                <div className="form-group">
                  <label>Application (Client) ID</label>
                  <input
                    type="text"
                    value={connectionForm.outlook.clientId}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      outlook: { ...connectionForm.outlook, clientId: e.target.value }
                    })}
                    placeholder="12345678-1234-1234-1234-123456789012"
                  />
                </div>

                <div className="form-group">
                  <label>Client Secret</label>
                  <input
                    type="password"
                    value={connectionForm.outlook.clientSecret}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      outlook: { ...connectionForm.outlook, clientSecret: e.target.value }
                    })}
                    placeholder="abc123~def456.ghi789"
                  />
                </div>

                <div className="form-group">
                  <label>Tenant ID (optional)</label>
                  <input
                    type="text"
                    value={connectionForm.outlook.tenantId}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      outlook: { ...connectionForm.outlook, tenantId: e.target.value }
                    })}
                    placeholder="common (for personal accounts)"
                  />
                </div>
              </div>
            )}

            {providerType === 'apple' && (
              <div className="connection-form">
                <div className="setup-instructions">
                  <h4>📋 Setup Instructions:</h4>
                  <ol>
                    <li>Go to <a href="https://appleid.apple.com" target="_blank">Apple ID Account</a></li>
                    <li>Navigate to Security section</li>
                    <li>Generate an App-Specific Password</li>
                    <li>Label it "TinkyBink Calendar Sync"</li>
                    <li>Use your Apple ID email and the app password below</li>
                  </ol>
                </div>

                <div className="form-group">
                  <label>Apple ID Email</label>
                  <input
                    type="email"
                    value={connectionForm.apple.username}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      apple: { ...connectionForm.apple, username: e.target.value }
                    })}
                    placeholder="your-email@icloud.com"
                  />
                </div>

                <div className="form-group">
                  <label>App-Specific Password</label>
                  <input
                    type="password"
                    value={connectionForm.apple.password}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      apple: { ...connectionForm.apple, password: e.target.value }
                    })}
                    placeholder="abcd-efgh-ijkl-mnop"
                  />
                </div>

                <div className="form-group">
                  <label>CalDAV Server (optional)</label>
                  <input
                    type="text"
                    value={connectionForm.apple.serverUrl}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      apple: { ...connectionForm.apple, serverUrl: e.target.value }
                    })}
                    placeholder="https://caldav.icloud.com"
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => setShowConnectionModal(null)}
                className="cancel-button"
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConnectProvider(providerType)}
                className="connect-button"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="spinner">🔄</span>
                    Connecting...
                  </>
                ) : (
                  <>
                    🔗 Connect {provider.name}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-integration-panel">
      <div className="panel-header">
        <h2>📅 Calendar Integration</h2>
        <p>Sync your TinkyBink appointments with your native calendars</p>
      </div>

      {/* Sync Controls */}
      <div className="sync-controls">
        <div className="sync-status">
          <h3>🔄 Sync Status</h3>
          <button onClick={handleManualSync} className="manual-sync-button">
            🔄 Sync Now
          </button>
        </div>

        {syncStatuses.size > 0 && (
          <div className="sync-summary">
            {Array.from(syncStatuses.entries()).map(([provider, status]) => (
              <div key={provider} className={`sync-item ${status.status}`}>
                <div className="sync-info">
                  <strong>{provider.charAt(0).toUpperCase() + provider.slice(1)}</strong>
                  <span className={`status-badge ${status.status}`}>
                    {status.status === 'success' && '✅'}
                    {status.status === 'error' && '❌'}
                    {status.status === 'pending' && '🔄'}
                    {status.status}
                  </span>
                </div>
                <div className="sync-details">
                  <span>{status.syncedAppointments} appointments</span>
                  <span>Last sync: {formatLastSync(status.lastSync)}</span>
                </div>
                {status.errors.length > 0 && (
                  <div className="sync-errors">
                    {status.errors.map((error, i) => (
                      <div key={i} className="error-message">⚠️ {error}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Provider Cards */}
      <div className="providers-grid">
        {providers.map((provider) => (
          <div key={provider.type} className={`provider-card ${provider.enabled ? 'connected' : 'disconnected'}`}>
            <div className="provider-header">
              <div className="provider-info">
                <span className="provider-icon">{provider.icon}</span>
                <h3>{provider.name}</h3>
              </div>
              <div className={`connection-status ${provider.enabled ? 'connected' : 'disconnected'}`}>
                {provider.enabled ? '🟢 Connected' : '🔴 Not Connected'}
              </div>
            </div>

            <p className="provider-description">{provider.description}</p>

            {/* Connection Actions */}
            <div className="provider-actions">
              {!provider.enabled ? (
                <button
                  onClick={() => setShowConnectionModal(provider.type)}
                  className="connect-button"
                >
                  🔗 Connect {provider.name}
                </button>
              ) : (
                <div className="connected-actions">
                  <button
                    onClick={() => handleDisconnectProvider(provider.type)}
                    className="disconnect-button"
                  >
                    🔌 Disconnect
                  </button>
                  <div className="connection-info">
                    <span>✅ Syncing appointments automatically</span>
                  </div>
                </div>
              )}
            </div>

            {/* Provider Features */}
            <div className="provider-features">
              <h4>🎯 What syncs:</h4>
              <ul>
                <li>📅 Appointment times and dates</li>
                <li>👤 Patient information (HIPAA compliant)</li>
                <li>🎯 Therapy goals and session plans</li>
                <li>💰 Billing information (CPT codes)</li>
                <li>📱 Automatic reminders</li>
                <li>🔄 Recurring appointments</li>
                <li>📍 Session locations</li>
              </ul>
            </div>

            {/* Sync Preview */}
            {provider.enabled && (
              <div className="sync-preview">
                <h4>📋 Example Calendar Event:</h4>
                <div className="calendar-event-preview">
                  <div className="event-title">
                    🧩 Individual Therapy Session
                  </div>
                  <div className="event-details">
                    <div>⏰ 9:00 AM - 9:30 AM</div>
                    <div>📍 Therapy Office</div>
                    <div>🎯 Goals: AAC device training, Communication practice</div>
                    <div>💰 CPT: 92507 | $150</div>
                    <div>📱 Reminders: 24hr, 15min before</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Integration Benefits */}
      <div className="integration-benefits">
        <h3>🚀 Why Connect Your Calendar?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">📱</span>
            <h4>Native Notifications</h4>
            <p>Get reminders on your phone, watch, and computer using your preferred calendar app</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🤝</span>
            <h4>Family Coordination</h4>
            <p>Share appointments with parents and caregivers through their calendar systems</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📊</span>
            <h4>Professional Integration</h4>
            <p>Sync with your existing workflow - Outlook, Google Workspace, or Apple ecosystem</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔄</span>
            <h4>Two-Way Sync</h4>
            <p>Changes in either calendar automatically update both systems</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🏥</span>
            <h4>HIPAA Compliant</h4>
            <p>Patient information is protected while still providing useful session details</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">💰</span>
            <h4>Billing Integration</h4>
            <p>Calendar events include CPT codes and billing information for easy tracking</p>
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal providerType={showConnectionModal} />
      )}

      <style jsx>{`
        .calendar-integration-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .panel-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .panel-header h2 {
          font-size: 28px;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .panel-header p {
          font-size: 16px;
          color: #718096;
        }

        .sync-controls {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }

        .sync-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .sync-status h3 {
          margin: 0;
          color: #1a202c;
          font-size: 18px;
        }

        .manual-sync-button {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .manual-sync-button:hover {
          background: #5a6fd8;
        }

        .sync-summary {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sync-item {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .sync-item.success {
          background: #f0fff4;
          border-color: #68d391;
        }

        .sync-item.error {
          background: #fef5e7;
          border-color: #f6ad55;
        }

        .sync-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.success {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.error {
          background: #fed7d7;
          color: #c53030;
        }

        .sync-details {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #4a5568;
        }

        .sync-errors {
          margin-top: 8px;
        }

        .error-message {
          font-size: 12px;
          color: #c53030;
          background: #fed7d7;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .provider-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .provider-card.connected {
          border-color: #48bb78;
        }

        .provider-card.disconnected {
          border-color: #e2e8f0;
        }

        .provider-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .provider-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .provider-icon {
          font-size: 24px;
        }

        .provider-info h3 {
          margin: 0;
          color: #1a202c;
          font-size: 18px;
        }

        .connection-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .connection-status.connected {
          background: #c6f6d5;
          color: #22543d;
        }

        .connection-status.disconnected {
          background: #fed7d7;
          color: #c53030;
        }

        .provider-description {
          color: #4a5568;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .provider-actions {
          margin-bottom: 20px;
        }

        .connect-button {
          width: 100%;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .connect-button:hover {
          background: #5a6fd8;
        }

        .connected-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disconnect-button {
          padding: 8px 16px;
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .disconnect-button:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .connection-info span {
          font-size: 14px;
          color: #22543d;
          background: #c6f6d5;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
        }

        .provider-features {
          margin-bottom: 20px;
        }

        .provider-features h4 {
          margin: 0 0 12px 0;
          color: #1a202c;
          font-size: 14px;
        }

        .provider-features ul {
          margin: 0;
          padding-left: 20px;
        }

        .provider-features li {
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 6px;
        }

        .sync-preview {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }

        .sync-preview h4 {
          margin: 0 0 12px 0;
          color: #1a202c;
          font-size: 14px;
        }

        .calendar-event-preview {
          background: #f7fafc;
          border-radius: 8px;
          padding: 12px;
          border-left: 4px solid #667eea;
        }

        .event-title {
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .event-details {
          font-size: 13px;
          color: #4a5568;
        }

        .event-details > div {
          margin-bottom: 4px;
        }

        .integration-benefits {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }

        .integration-benefits h3 {
          text-align: center;
          margin: 0 0 24px 0;
          color: #1a202c;
          font-size: 20px;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .benefit-item {
          text-align: center;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
        }

        .benefit-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .benefit-item h4 {
          margin: 0 0 8px 0;
          color: #1a202c;
          font-size: 16px;
        }

        .benefit-item p {
          margin: 0;
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #1a202c;
          font-size: 20px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #4a5568;
        }

        .modal-body {
          padding: 24px;
        }

        .connection-description {
          color: #4a5568;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .setup-instructions {
          background: #f7fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .setup-instructions h4 {
          margin: 0 0 12px 0;
          color: #1a202c;
          font-size: 16px;
        }

        .setup-instructions ol {
          margin: 0;
          padding-left: 20px;
        }

        .setup-instructions li {
          margin-bottom: 8px;
          font-size: 14px;
          color: #4a5568;
          line-height: 1.4;
        }

        .setup-instructions a {
          color: #667eea;
          text-decoration: none;
        }

        .setup-instructions a:hover {
          text-decoration: underline;
        }

        .setup-instructions code {
          background: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }

        .connection-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 500;
          color: #1a202c;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-group input {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-button {
          padding: 10px 20px;
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .cancel-button:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .providers-grid {
            grid-template-columns: 1fr;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .sync-status {
            flex-direction: column;
            gap: 16px;
          }

          .sync-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}