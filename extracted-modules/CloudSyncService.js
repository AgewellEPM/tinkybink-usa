class CloudSyncService {
      constructor() {
        this.syncEnabled = false;
        this.lastSync = null;
        this.syncInProgress = false;
      }
      
      initialize() {
        console.log('Cloud Sync Service ready');
        this.loadSyncSettings();
      }
      
      loadSyncSettings() {
        const saved = localStorage.getItem('tinkybink_sync_settings');
        if (saved) {
          try {
            const settings = JSON.parse(saved);
            this.syncEnabled = settings.enabled;
            this.lastSync = settings.lastSync;
          } catch (error) {
            console.error('Failed to parse sync settings:', error);
          }
        }
      }
      
      async syncUserData() {
        const auth = moduleSystem.get('AuthService');
        if (!auth || !auth.isAuthenticated()) {
          console.log('Cannot sync - user not authenticated');
          return;
        }
        
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        const user = auth.getUser();
        
        try {
          // Prepare data for sync
          const syncData = {
            userId: user.id,
            timestamp: new Date().toISOString(),
            boards: boards,
            settings: settings,
            chirps: chirps,
            analytics: moduleSystem.get('AnalyticsService')?.getReport()
          };
          
          // In a real implementation, this would sync to a cloud service
          // For now, we'll store in localStorage with user prefix
          localStorage.setItem(`tinkybink_cloud_${user.id}`, JSON.stringify(syncData));
          
          this.lastSync = new Date().toISOString();
          this.saveSyncSettings();
          
          console.log('Data synced to cloud for user:', user.email);
          this.showSyncNotification('Data synced successfully');
          
        } catch (error) {
          console.error('Sync failed:', error);
          this.showSyncNotification('Sync failed', 'error');
        } finally {
          this.syncInProgress = false;
        }
      }
      
      async loadUserData() {
        const auth = moduleSystem.get('AuthService');
        if (!auth || !auth.isAuthenticated()) return;
        
        const user = auth.getUser();
        const cloudData = localStorage.getItem(`tinkybink_cloud_${user.id}`);
        
        if (cloudData) {
          try {
            const data = JSON.parse(cloudData);
            
            // Restore user's boards
            if (data.boards) {
              Object.assign(boards, data.boards);
            }
            
            // Restore settings
            if (data.settings) {
              Object.assign(settings, data.settings);
              updateDisplaySettings();
            }
            
            // Restore chirps
            if (data.chirps) {
              chirps = data.chirps;
              loadChirps();
            }
            
            renderBoard();
            this.showSyncNotification('Data loaded from cloud');
            
          } catch (error) {
            console.error('Failed to load cloud data:', error);
          }
        }
      }
      
      saveSyncSettings() {
        localStorage.setItem('tinkybink_sync_settings', JSON.stringify({
          enabled: this.syncEnabled,
          lastSync: this.lastSync
        }));
      }
      
      showSyncNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
          color: white;
          padding: 15px 25px;
          border-radius: 8px;
          font-size: 16px;
          z-index: 3000;
          animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.5s;
        `;
        notification.textContent = '☁️ ' + message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
      }
      
      toggleAutoSync() {
        this.syncEnabled = !this.syncEnabled;
        this.saveSyncSettings();
        
        if (this.syncEnabled) {
          this.syncUserData();
          // Set up auto-sync every 5 minutes
          this.syncInterval = setInterval(() => this.syncUserData(), 300000);
        } else {
          clearInterval(this.syncInterval);
        }
        
        return this.syncEnabled;
      }
    }