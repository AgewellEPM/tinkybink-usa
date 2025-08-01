'use client';

import { useState, useEffect } from 'react';
import { getAuthService, getCloudSyncService } from '@/modules/module-system';

export function AccountCloudSection() {
  const [authService, setAuthService] = useState<ReturnType<typeof getAuthService> | null>(null);
  const [cloudSyncService, setCloudSyncService] = useState<ReturnType<typeof getCloudSyncService> | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthService();
      const cloudSync = getCloudSyncService();
      
      setAuthService(auth);
      setCloudSyncService(cloudSync);
      
      // Check initial auth state
      setIsSignedIn(auth.isAuthenticated());
      setUserInfo(auth.getCurrentUser());
      
      // Check cloud sync settings
      const settings = cloudSync.getSyncOptions();
      setAutoSyncEnabled(settings.autoSync);
      
      // Subscribe to auth changes
      const unsubscribe = auth.onAuthChange((user) => {
        setIsSignedIn(!!user);
        setUserInfo(user);
      });
      
      return () => unsubscribe();
    }
  }, []);

  // EXACT COPY FROM HTML VERSION - Simple Google Sign-In
  const handleGoogleSignIn = async () => {
    if (!authService) return;
    
    try {
      // Simple sign-in call (HTML version just calls signIn())
      authService.signIn();
      setSyncStatus('Signing in with Google...');
    } catch (error) {
      setSyncStatus('Sign in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    if (!authService) return;
    
    await authService.signOut();
    setSyncStatus('Signed out successfully');
  };

  const handleSyncNow = async () => {
    if (!cloudSyncService) return;
    
    setSyncStatus('Syncing...');
    try {
      const result = await cloudSyncService.syncNow();
      if (result.success) {
        setSyncStatus(`Synced successfully! ${result.itemsSynced} items updated.`);
      } else {
        setSyncStatus('Sync failed. Please try again.');
      }
    } catch (error) {
      setSyncStatus('Sync error occurred.');
    }
  };

  // EXACT COPY FROM HTML VERSION - Toggle sync
  const toggleAutoSync = () => {
    if (!cloudSyncService) return;
    
    const newState = !autoSyncEnabled;
    setAutoSyncEnabled(newState);
    
    // Store in localStorage like HTML version
    const settings = JSON.parse(localStorage.getItem('tinkyBinkSettings') || '{}');
    settings.cloudSync = newState;
    localStorage.setItem('tinkyBinkSettings', JSON.stringify(settings));
    
    // Update service
    cloudSyncService.enableSync(newState);
    
    setSyncStatus(newState ? 'Auto-sync enabled' : 'Auto-sync disabled');
  };

  return (
    <div className="settings-section">
      <h3>👤 Account & Cloud</h3>
      
      <div id="authSection" style={{ marginBottom: '15px' }}>
        {!isSignedIn ? (
          <button 
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {userInfo?.picture && (
                <img 
                  src={userInfo.picture} 
                  alt="Profile" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'white' }}>{userInfo?.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{userInfo?.email}</div>
              </div>
              <button 
                onClick={handleSignOut}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isSignedIn && (
        <div id="cloudSyncSection">
          <div className="action-buttons">
            <button className="action-btn" onClick={handleSyncNow}>
              ☁️ Sync Now
            </button>
            <button 
              className={`action-btn secondary ${autoSyncEnabled ? 'active' : ''}`}
              onClick={toggleAutoSync}
            >
              🔄 Auto-Sync: {autoSyncEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {syncStatus && (
            <div style={{ marginTop: '10px', color: '#888', fontSize: '14px' }}>
              {syncStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}