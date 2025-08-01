class OfflineManager {
      constructor() {
        this.swRegistration = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.initializeServiceWorker();
        this.setupEventListeners();
      }
      
      async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
          try {
            // Register inline service worker
            const swCode = `
              const CACHE_NAME = 'tinkybink-v1';
              const urlsToCache = [
                '/',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://accounts.google.com/gsi/client'
              ];
              
              self.addEventListener('install', event => {
                event.waitUntil(
                  caches.open(CACHE_NAME)
                    .then(cache => cache.addAll(urlsToCache))
                );
              });
              
              self.addEventListener('fetch', event => {
                event.respondWith(
                  caches.match(event.request)
                    .then(response => {
                      if (response) {
                        return response;
                      }
                      return fetch(event.request).then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                          return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                          cache.put(event.request, responseToCache);
                        });
                        return response;
                      });
                    })
                );
              });
              
              self.addEventListener('sync', event => {
                if (event.tag === 'sync-data') {
                  event.waitUntil(syncOfflineData());
                }
              });
              
              async function syncOfflineData() {
                const db = await openDB();
                const tx = db.transaction('syncQueue', 'readonly');
                const store = tx.objectStore('syncQueue');
                const allData = await store.getAll();
                
                for (const item of allData) {
                  try {
                    await fetch(item.url, {
                      method: item.method,
                      headers: item.headers,
                      body: JSON.stringify(item.body)
                    });
                    // Remove from queue after successful sync
                    const deleteTx = db.transaction('syncQueue', 'readwrite');
                    await deleteTx.objectStore('syncQueue').delete(item.id);
                  } catch (error) {
                    console.error('Sync failed for item:', item.id);
                  }
                }
              }
              
              async function openDB() {
                return new Promise((resolve, reject) => {
                  const request = indexedDB.open('TinkybinkOffline', 1);
                  request.onsuccess = () => resolve(request.result);
                  request.onerror = () => reject(request.error);
                  request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('syncQueue')) {
                      db.createObjectStore('syncQueue', { keyPath: 'id' });
                    }
                  };
                });
              }
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            this.swRegistration = await navigator.serviceWorker.register(swUrl);
            console.log('Service Worker registered');
            
            // Request background sync permission
            if ('permissions' in navigator) {
              const result = await navigator.permissions.query({ name: 'background-sync' });
              console.log('Background sync permission:', result.state);
            }
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }
      }
      
      setupEventListeners() {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.showNotification('Back online! Syncing data...');
          this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.showNotification('You are offline. Changes will be saved locally.');
        });
      }
      
      async syncOfflineData() {
        if (!this.isOnline) return;
        
        // Sync authentication data
        if (window.authSystem && window.authSystem.isAuthenticated()) {
          await this.syncAuthData();
        }
        
        // Sync patient data
        if (window.healthcareDB) {
          await this.syncPatientData();
        }
        
        // Sync analytics data
        if (window.analyticsService) {
          await this.syncAnalyticsData();
        }
        
        // Request background sync
        if (this.swRegistration && 'sync' in this.swRegistration) {
          try {
            await this.swRegistration.sync.register('sync-data');
          } catch (error) {
            console.error('Background sync registration failed:', error);
          }
        }
      }
      
      async syncAuthData() {
        const securityEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
        const unsyncedEvents = securityEvents.filter(e => !e.synced);
        
        for (const event of unsyncedEvents) {
          try {
            // In production, send to server
            console.log('Syncing security event:', event);
            event.synced = true;
          } catch (error) {
            console.error('Failed to sync security event:', error);
          }
        }
        
        localStorage.setItem('security_events', JSON.stringify(securityEvents));
      }
      
      async syncPatientData() {
        const patients = window.healthcareDB.patients.filter(p => !p.synced);
        const sessions = window.healthcareDB.sessions.filter(s => !s.synced);
        
        // Sync patients
        for (const patient of patients) {
          try {
            // In production, send to server
            console.log('Syncing patient:', patient.id);
            patient.synced = true;
          } catch (error) {
            console.error('Failed to sync patient:', error);
          }
        }
        
        // Sync sessions
        for (const session of sessions) {
          try {
            // In production, send to server
            console.log('Syncing session:', session.id);
            session.synced = true;
          } catch (error) {
            console.error('Failed to sync session:', error);
          }
        }
        
        window.healthcareDB.saveData('patients', window.healthcareDB.patients);
        window.healthcareDB.saveData('sessions', window.healthcareDB.sessions);
      }
      
      async syncAnalyticsData() {
        const analytics = JSON.parse(localStorage.getItem('analytics_data') || '[]');
        const unsyncedData = analytics.filter(a => !a.synced);
        
        for (const data of unsyncedData) {
          try {
            // In production, send to server
            console.log('Syncing analytics:', data);
            data.synced = true;
          } catch (error) {
            console.error('Failed to sync analytics:', error);
          }
        }
        
        localStorage.setItem('analytics_data', JSON.stringify(analytics));
      }
      
      showNotification(message) {
        // Show in-app notification
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.textContent = message;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${this.isOnline ? '#00C851' : '#FF9800'};
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
      
      // Queue operations for offline sync
      async queueOperation(operation) {
        const id = Date.now().toString();
        const item = {
          id,
          ...operation,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        // Store in IndexedDB
        const db = await this.openDB();
        const tx = db.transaction('syncQueue', 'readwrite');
        await tx.objectStore('syncQueue').add(item);
        
        // Try to sync immediately if online
        if (this.isOnline) {
          this.syncOfflineData();
        }
      }
      
      async openDB() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open('TinkybinkOffline', 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
              db.createObjectStore('syncQueue', { keyPath: 'id' });
            }
          };
        });
      }
    }
    
    // Initialize offline manager
    window.offlineManager = new OfflineManager();
    
    // Mobile App Wrapper for Native Features