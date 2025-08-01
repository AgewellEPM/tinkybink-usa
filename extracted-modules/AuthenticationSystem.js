class AuthenticationSystem {
      constructor() {
        this.currentUser = null;
        this.sessions = {};
        this.clinics = {};
        this.initializeAuth();
      }
      
      initializeAuth() {
        // Check for existing session
        const savedSession = localStorage.getItem('tinkybink_session');
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            if (this.validateSession(session)) {
              this.currentUser = session.user;
              this.restoreUserState();
            } else {
              this.logout();
            }
          } catch (e) {
            this.logout();
          }
        }
      }
      
      validateSession(session) {
        // Check session expiry (24 hours)
        const now = Date.now();
        if (session.expiresAt < now) return false;
        
        // Validate session token
        return this.verifySessionToken(session.token);
      }
      
      verifySessionToken(token) {
        // In production, verify against backend
        // For now, check basic token structure
        return token && token.length === 64;
      }
      
      async login(credentials) {
        try {
          // In production, call backend API
          const response = await this.authenticateUser(credentials);
          
          if (response.success) {
            const session = {
              user: response.user,
              token: response.token,
              clinicId: response.clinicId,
              expiresAt: Date.now() + (24 * 60 * 60 * 1000),
              createdAt: Date.now()
            };
            
            this.currentUser = response.user;
            this.sessions[response.token] = session;
            
            // Store encrypted session
            const encryptedSession = this.encryptData(JSON.stringify(session));
            localStorage.setItem('tinkybink_session', encryptedSession);
            
            // Log security event
            this.logSecurityEvent('LOGIN', response.user.id);
            
            return { success: true };
          }
          
          return { success: false, error: response.error };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'Authentication failed' };
        }
      }
      
      async authenticateUser(credentials) {
        // Simulate backend authentication
        const { email, password, mfaCode } = credentials;
        
        // Hash password (in production, done server-side)
        const hashedPassword = await this.hashPassword(password);
        
        // Mock user database
        const users = {
          'therapist@clinic.com': {
            id: 'USR001',
            email: 'therapist@clinic.com',
            password: hashedPassword,
            role: 'therapist',
            name: 'Dr. Sarah Johnson',
            clinicId: 'CLINIC001',
            mfaEnabled: true,
            permissions: ['view_patients', 'edit_sessions', 'generate_reports']
          },
          'admin@clinic.com': {
            id: 'USR002',
            email: 'admin@clinic.com',
            password: hashedPassword,
            role: 'admin',
            name: 'Admin User',
            clinicId: 'CLINIC001',
            mfaEnabled: true,
            permissions: ['all']
          },
          'parent@gmail.com': {
            id: 'USR003',
            email: 'parent@gmail.com',
            password: hashedPassword,
            role: 'parent',
            name: 'John Smith',
            patientIds: ['PAT001'],
            mfaEnabled: false,
            permissions: ['view_own_child', 'view_reports']
          }
        };
        
        const user = users[email];
        if (!user || user.password !== hashedPassword) {
          return { success: false, error: 'Invalid credentials' };
        }
        
        // Verify MFA if enabled
        if (user.mfaEnabled && !this.verifyMFA(mfaCode, user.id)) {
          return { success: false, error: 'Invalid MFA code' };
        }
        
        // Generate session token
        const token = this.generateSecureToken();
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            clinicId: user.clinicId,
            patientIds: user.patientIds
          },
          token,
          clinicId: user.clinicId
        };
      }
      
      async hashPassword(password) {
        // In production, use bcrypt or similar
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'SALT_KEY');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
      
      generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      }
      
      verifyMFA(code, userId) {
        // In production, verify TOTP/SMS code
        return code === '123456'; // Mock verification
      }
      
      encryptData(data) {
        // Basic encryption for demo (use proper encryption in production)
        return btoa(encodeURIComponent(data));
      }
      
      decryptData(data) {
        try {
          return decodeURIComponent(atob(data));
        } catch {
          return null;
        }
      }
      
      logout() {
        if (this.currentUser) {
          this.logSecurityEvent('LOGOUT', this.currentUser.id);
        }
        
        this.currentUser = null;
        localStorage.removeItem('tinkybink_session');
        sessionStorage.clear();
        
        // Clear sensitive data
        if (window.patientSystem) {
          window.patientSystem.clearCache();
        }
        
        // Redirect to login
        this.showLoginScreen();
      }
      
      hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'admin') return true;
        return this.currentUser.permissions.includes(permission);
      }
      
      isAuthenticated() {
        return !!this.currentUser;
      }
      
      getCurrentUser() {
        return this.currentUser;
      }
      
      getClinicId() {
        return this.currentUser?.clinicId;
      }
      
      logSecurityEvent(eventType, userId, details = {}) {
        const event = {
          type: eventType,
          userId,
          timestamp: new Date().toISOString(),
          ip: 'CLIENT_IP', // In production, get from server
          userAgent: navigator.userAgent,
          details
        };
        
        // In production, send to security logging service
        console.log('Security Event:', event);
        
        // Store locally for audit trail
        const events = JSON.parse(localStorage.getItem('security_events') || '[]');
        events.push(event);
        if (events.length > 1000) events.shift(); // Keep last 1000 events
        localStorage.setItem('security_events', JSON.stringify(events));
      }
      
      // Multi-tenancy support
      async switchClinic(clinicId) {
        if (!this.hasPermission('switch_clinics')) {
          return { success: false, error: 'Permission denied' };
        }
        
        this.currentUser.clinicId = clinicId;
        this.updateSession();
        
        // Reload clinic-specific data
        await this.loadClinicData(clinicId);
        
        return { success: true };
      }
      
      async loadClinicData(clinicId) {
        // Load clinic-specific settings, patients, etc.
        const clinicData = await this.fetchClinicData(clinicId);
        this.clinics[clinicId] = clinicData;
        
        // Update UI with clinic branding
        if (clinicData.branding) {
          this.applyClinicBranding(clinicData.branding);
        }
      }
      
      async fetchClinicData(clinicId) {
        // In production, fetch from API
        return {
          id: clinicId,
          name: 'Sample Speech Therapy Clinic',
          branding: {
            primaryColor: '#7b3ff2',
            logo: '/clinic-logo.png',
            name: 'Speech Therapy Plus'
          },
          settings: {
            sessionDuration: 30,
            billingEnabled: true,
            telehealth: true
          }
        };
      }
      
      applyClinicBranding(branding) {
        if (branding.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
        }
        // Apply other branding elements
      }
      
      updateSession() {
        const session = localStorage.getItem('tinkybink_session');
        if (session) {
          const decrypted = this.decryptData(session);
          if (decrypted) {
            const sessionData = JSON.parse(decrypted);
            sessionData.user = this.currentUser;
            localStorage.setItem('tinkybink_session', this.encryptData(JSON.stringify(sessionData)));
          }
        }
      }
      
      showLoginScreen() {
        // Will be implemented with UI
        document.body.innerHTML = this.getLoginHTML();
        this.attachLoginHandlers();
      }
      
      getLoginHTML() {
        return `
          <div class="login-container">
            <div class="login-box">
              <h1>TinkyBink AAC</h1>
              <h2>Secure Login</h2>
              <form id="loginForm">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="email" required>
                </div>
                <div class="form-group">
                  <label>Password</label>
                  <input type="password" id="password" required>
                </div>
                <div class="form-group" id="mfaGroup" style="display:none;">
                  <label>MFA Code</label>
                  <input type="text" id="mfaCode" maxlength="6">
                </div>
                <button type="submit" class="login-btn">Login</button>
                <div class="login-options">
                  <label>
                    <input type="checkbox" id="rememberMe"> Remember me
                  </label>
                  <a href="#" id="forgotPassword">Forgot password?</a>
                </div>
              </form>
              <div class="demo-accounts">
                <h3>Demo Accounts:</h3>
                <p>Therapist: therapist@clinic.com (MFA: 123456)</p>
                <p>Admin: admin@clinic.com (MFA: 123456)</p>
                <p>Parent: parent@gmail.com</p>
                <p>Password for all: demo123</p>
              </div>
            </div>
          </div>
          <style>
            .login-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #0a0a0a;
            }
            .login-box {
              background: rgba(26, 26, 26, 0.95);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.5);
              width: 100%;
              max-width: 400px;
            }
            .login-box h1 {
              color: var(--primary-color);
              text-align: center;
              margin-bottom: 10px;
            }
            .login-box h2 {
              color: #fff;
              text-align: center;
              margin-bottom: 30px;
              font-weight: 300;
            }
            .form-group {
              margin-bottom: 20px;
            }
            .form-group label {
              display: block;
              color: #aaa;
              margin-bottom: 8px;
            }
            .form-group input {
              width: 100%;
              padding: 12px;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 6px;
              color: white;
              font-size: 16px;
            }
            .login-btn {
              width: 100%;
              padding: 14px;
              background: var(--primary-color);
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              transition: opacity 0.3s;
            }
            .login-btn:hover {
              opacity: 0.9;
            }
            .login-options {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              color: #aaa;
              font-size: 14px;
            }
            .login-options a {
              color: var(--primary-color);
              text-decoration: none;
            }
            .demo-accounts {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255,255,255,0.1);
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .demo-accounts h3 {
              color: #aaa;
              margin-bottom: 10px;
            }
          </style>
        `;
      }
      
      attachLoginHandlers() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const mfaCode = document.getElementById('mfaCode').value;
          
          const result = await this.login({ email, password, mfaCode });
          
          if (result.success) {
            location.reload(); // Reload to show main app
          } else {
            if (result.error === 'Invalid MFA code') {
              document.getElementById('mfaGroup').style.display = 'block';
              alert('Please enter your MFA code');
            } else {
              alert(result.error || 'Login failed');
            }
          }
        });
        
        document.getElementById('forgotPassword').addEventListener('click', (e) => {
          e.preventDefault();
          alert('Password reset functionality would be implemented here');
        });
      }
      
      restoreUserState() {
        // Restore user-specific settings and data
        console.log('User authenticated:', this.currentUser.name);
      }
    }
    
    // Initialize authentication system
    window.authSystem = new AuthenticationSystem();
    
    // Service Worker & Offline Support