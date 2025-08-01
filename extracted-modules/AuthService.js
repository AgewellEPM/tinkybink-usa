class AuthService {
      constructor() {
        this.currentUser = null;
        this.isSignedIn = false;
      }
      
      initialize() {
        console.log('Auth Service ready');
        this.initGoogleAuth();
      }
      
      initGoogleAuth() {
        // Initialize Google Sign-In
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.initialize({
            client_id: '614069871226-k1mpnt4q1f07gf833fjft787la57q7tg.apps.googleusercontent.com',
            callback: this.handleCredentialResponse.bind(this)
          });
        }
      }
      
      handleCredentialResponse(response) {
        // Decode the JWT token
        const userObject = this.parseJwt(response.credential);
        
        this.currentUser = {
          id: userObject.sub,
          name: userObject.name,
          email: userObject.email,
          picture: userObject.picture
        };
        
        this.isSignedIn = true;
        console.log('User signed in:', this.currentUser);
        
        // Track sign in
        const analytics = moduleSystem.get('AnalyticsService');
        if (analytics) {
          analytics.track('user_sign_in', {
            userId: this.currentUser.id,
            userName: this.currentUser.name
          });
        }
        
        // Update UI
        this.updateAuthUI();
        
        // Trigger profile service
        const profileService = moduleSystem.get('ProfileService');
        if (profileService) {
          profileService.setUser(this.currentUser);
        }
        
        // Trigger cloud sync
        const cloudSync = moduleSystem.get('CloudSyncService');
        if (cloudSync) {
          cloudSync.syncUserData();
        }
        
        speak('Welcome ' + this.currentUser.name);
      }
      
      parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
      }
      
      updateAuthUI() {
        const authSection = document.getElementById('authSection');
        if (authSection) {
          if (this.isSignedIn) {
            authSection.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${this.currentUser.picture}" alt="${this.currentUser.name}" 
                     style="width: 40px; height: 40px; border-radius: 50%;">
                <span style="color: #ddd;">${this.currentUser.name}</span>
                <button class="action-btn secondary" onclick="moduleSystem.get('AuthService').signOut()">
                  Sign Out
                </button>
              </div>
            `;
          } else {
            authSection.innerHTML = `
              <div id="googleSignInDiv"></div>
            `;
            
            // Render Google Sign-In button
            if (typeof google !== 'undefined' && google.accounts) {
              google.accounts.id.renderButton(
                document.getElementById('googleSignInDiv'),
                { 
                  theme: 'filled_black',
                  size: 'large',
                  width: '100%'
                }
              );
            }
          }
        }
      }
      
      signOut() {
        this.currentUser = null;
        this.isSignedIn = false;
        
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.disableAutoSelect();
        }
        
        this.updateAuthUI();
        speak('Signed out');
        
        // Track sign out
        const analytics = moduleSystem.get('AnalyticsService');
        if (analytics) {
          analytics.track('user_sign_out', {});
        }
        
        // Clear user data from other services
        const profileService = moduleSystem.get('ProfileService');
        if (profileService) {
          profileService.clearUser();
        }
      }
      
      getUser() {
        return this.currentUser;
      }
      
      isAuthenticated() {
        return this.isSignedIn;
      }
    }