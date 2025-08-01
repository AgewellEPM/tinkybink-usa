class MobileAppWrapper {
      constructor() {
        this.platform = this.detectPlatform();
        this.capabilities = this.detectCapabilities();
        this.initializeNativeFeatures();
      }
      
      detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
          return 'ios';
        } else if (/android/.test(userAgent)) {
          return 'android';
        } else if (/windows phone/.test(userAgent)) {
          return 'windows';
        }
        return 'web';
      }
      
      detectCapabilities() {
        return {
          camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          geolocation: 'geolocation' in navigator,
          speech: 'speechSynthesis' in window,
          speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
          notification: 'Notification' in window,
          vibration: 'vibrate' in navigator,
          share: 'share' in navigator,
          bluetooth: 'bluetooth' in navigator,
          nfc: 'NDEFReader' in window,
          deviceOrientation: window.DeviceOrientationEvent !== undefined,
          wakeLock: 'wakeLock' in navigator,
          contacts: 'ContactsManager' in window,
          fileSystem: 'showOpenFilePicker' in window
        };
      }
      
      initializeNativeFeatures() {
        // Request permissions for native features
        this.requestPermissions();
        
        // Set up native UI adaptations
        this.setupNativeUI();
        
        // Initialize native bridges if available
        this.setupNativeBridges();
      }
      
      async requestPermissions() {
        // Camera permission
        if (this.capabilities.camera) {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            console.log('Camera permission granted');
          } catch (error) {
            console.log('Camera permission denied');
          }
        }
        
        // Notification permission
        if (this.capabilities.notification && Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
          } catch (error) {
            console.log('Notification permission error:', error);
          }
        }
        
        // Geolocation permission
        if (this.capabilities.geolocation) {
          navigator.geolocation.getCurrentPosition(
            () => console.log('Geolocation permission granted'),
            () => console.log('Geolocation permission denied')
          );
        }
      }
      
      setupNativeUI() {
        // iOS specific UI adjustments
        if (this.platform === 'ios') {
          // Handle safe area insets
          document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
          document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
          
          // Prevent bounce scrolling
          document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.scrollable')) return;
            e.preventDefault();
          }, { passive: false });
          
          // Handle status bar
          if (window.webkit && window.webkit.messageHandlers) {
            this.sendToNative('setStatusBarStyle', { style: 'light' });
          }
        }
        
        // Android specific UI adjustments
        if (this.platform === 'android') {
          // Handle back button
          window.addEventListener('popstate', (e) => {
            if (this.handleBackButton()) {
              e.preventDefault();
            }
          });
          
          // Material design ripple effect
          this.addRippleEffect();
        }
        
        // Add pull-to-refresh
        this.setupPullToRefresh();
      }
      
      setupNativeBridges() {
        // iOS WKWebView bridge
        if (window.webkit && window.webkit.messageHandlers) {
          window.nativeBridge = {
            send: (action, data) => {
              window.webkit.messageHandlers.tinkybink.postMessage({ action, data });
            }
          };
        }
        
        // Android WebView bridge
        if (window.Android) {
          window.nativeBridge = {
            send: (action, data) => {
              window.Android.handleMessage(JSON.stringify({ action, data }));
            }
          };
        }
        
        // Capacitor bridge
        if (window.Capacitor) {
          window.nativeBridge = {
            send: async (action, data) => {
              const { Plugins } = window.Capacitor;
              if (Plugins.TinkybinkPlugin) {
                return await Plugins.TinkybinkPlugin[action](data);
              }
            }
          };
        }
        
        // React Native bridge
        if (window.ReactNativeWebView) {
          window.nativeBridge = {
            send: (action, data) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ action, data }));
            }
          };
        }
      }
      
      setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        
        const container = document.body;
        const threshold = 100;
        
        container.addEventListener('touchstart', (e) => {
          if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
          }
        });
        
        container.addEventListener('touchmove', (e) => {
          if (!pulling) return;
          
          currentY = e.touches[0].pageY;
          const diff = currentY - startY;
          
          if (diff > 0 && diff < threshold * 2) {
            e.preventDefault();
            const progress = Math.min(diff / threshold, 1);
            this.showPullToRefreshIndicator(progress);
          }
        });
        
        container.addEventListener('touchend', () => {
          if (!pulling) return;
          
          const diff = currentY - startY;
          if (diff > threshold) {
            this.triggerRefresh();
          }
          
          pulling = false;
          this.hidePullToRefreshIndicator();
        });
      }
      
      showPullToRefreshIndicator(progress) {
        let indicator = document.getElementById('pullToRefreshIndicator');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.id = 'pullToRefreshIndicator';
          indicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: transform 0.2s;
          `;
          indicator.innerHTML = '↻';
          document.body.appendChild(indicator);
        }
        
        indicator.style.transform = `translateX(-50%) translateY(${progress * 80}px) rotate(${progress * 360}deg)`;
      }
      
      hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pullToRefreshIndicator');
        if (indicator) {
          indicator.style.transform = 'translateX(-50%) translateY(0)';
          setTimeout(() => indicator.remove(), 200);
        }
      }
      
      triggerRefresh() {
        // Sync data
        window.offlineManager.syncOfflineData();
        
        // Vibrate if supported
        if (this.capabilities.vibration) {
          navigator.vibrate(50);
        }
        
        // Show notification
        window.offlineManager.showNotification('Refreshing data...');
      }
      
      addRippleEffect() {
        document.addEventListener('click', (e) => {
          const target = e.target.closest('button, .tile, .header-btn');
          if (!target) return;
          
          const ripple = document.createElement('span');
          ripple.className = 'ripple';
          ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out;
          `;
          
          const rect = target.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
          ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
          
          target.style.position = 'relative';
          target.style.overflow = 'hidden';
          target.appendChild(ripple);
          
          setTimeout(() => ripple.remove(), 600);
        });
        
        // Add ripple animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes rippleEffect {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      handleBackButton() {
        // Check if any modals are open
        const modals = document.querySelectorAll('.modal, .settings-panel');
        for (const modal of modals) {
          if (modal.style.display !== 'none') {
            modal.style.display = 'none';
            return true;
          }
        }
        
        // Check if we can go back in navigation
        if (window.history.length > 1) {
          window.history.back();
          return true;
        }
        
        return false;
      }
      
      sendToNative(action, data) {
        if (window.nativeBridge) {
          window.nativeBridge.send(action, data);
        }
      }
      
      // Native feature wrappers
      async capturePhoto() {
        if (this.capabilities.camera) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            // Create photo capture UI
            const captureUI = document.createElement('div');
            captureUI.style.cssText = `
              position: fixed;
              inset: 0;
              background: black;
              z-index: 100000;
              display: flex;
              flex-direction: column;
            `;
            
            captureUI.innerHTML = `
              <video style="flex: 1; object-fit: cover;"></video>
              <div style="padding: 20px; display: flex; justify-content: space-around;">
                <button onclick="window.mobileApp.cancelCapture()" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px;">Cancel</button>
                <button onclick="window.mobileApp.takePhoto()" style="padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 8px;">Capture</button>
              </div>
            `;
            
            const videoElement = captureUI.querySelector('video');
            videoElement.srcObject = stream;
            document.body.appendChild(captureUI);
            
            window.mobileApp._currentStream = stream;
            window.mobileApp._captureUI = captureUI;
            
            return new Promise((resolve) => {
              window.mobileApp._captureResolve = resolve;
            });
          } catch (error) {
            console.error('Camera error:', error);
            return null;
          }
        }
      }
      
      takePhoto() {
        const video = document.querySelector('video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        this.cancelCapture();
        
        if (window.mobileApp._captureResolve) {
          window.mobileApp._captureResolve(dataUrl);
        }
      }
      
      cancelCapture() {
        if (window.mobileApp._currentStream) {
          window.mobileApp._currentStream.getTracks().forEach(track => track.stop());
        }
        if (window.mobileApp._captureUI) {
          window.mobileApp._captureUI.remove();
        }
      }
      
      async shareContent(data) {
        if (this.capabilities.share) {
          try {
            await navigator.share(data);
            return true;
          } catch (error) {
            console.error('Share error:', error);
            return false;
          }
        }
        return false;
      }
      
      vibrate(pattern = 50) {
        if (this.capabilities.vibration) {
          navigator.vibrate(pattern);
        }
      }
      
      async requestWakeLock() {
        if (this.capabilities.wakeLock) {
          try {
            const wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');
            return wakeLock;
          } catch (error) {
            console.error('Wake lock error:', error);
          }
        }
        return null;
      }
    }
    
    // Initialize mobile app wrapper
    window.mobileApp = new MobileAppWrapper();
    
    // Real-Time Collaboration System