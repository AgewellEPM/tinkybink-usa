/**
 * Auth Service
 * Module 36: Google Sign-In and authentication management
 */

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  imageUrl: string;
  givenName: string;
  familyName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  token: string | null;
  expiresAt: Date | null;
}

interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  createdAt: string;
  expiresAt: string;
  device: string;
  ipAddress?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState;
  private sessions: Map<string, AuthSession> = new Map();
  private googleClientId = '614069871226-k1mpnt4q1f07gf833fjft787la57q7tg.apps.googleusercontent.com';
  private isInitialized = false;
  private authCallbacks: ((user: GoogleUser | null) => void)[] = [];

  private constructor() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null
    };
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  initialize(): void {
    console.log('🔐 Auth Service ready - Google Sign-In integration');
    this.loadAuthState();
    this.initGoogleAuth();
  }

  /**
   * Initialize Google Sign-In
   */
  private initGoogleAuth(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    // Load Google Identity Services script if not already loaded
    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => this.setupGoogleAuth();
      document.head.appendChild(script);
    } else {
      this.setupGoogleAuth();
    }
  }

  /**
   * Setup Google authentication
   */
  private setupGoogleAuth(): void {
    if (!window.google?.accounts?.id) {
      console.error('Google Identity Services not loaded');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: true,
        cancel_on_tap_outside: false
      });

      // Check for saved session
      const savedToken = this.getStoredToken();
      if (savedToken && this.isTokenValid(savedToken)) {
        // Auto sign-in with saved session
        this.restoreSession(savedToken);
      } else {
        // Render sign-in button
        this.renderSignInButton();
      }

      this.isInitialized = true;
      console.log('✅ Google Auth initialized');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
    }
  }

  /**
   * Handle Google credential response
   */
  private handleCredentialResponse(response: any): void {
    const credential = response.credential;
    
    if (!credential) {
      console.error('No credential received');
      return;
    }

    try {
      // Decode JWT token
      const payload = this.decodeJWT(credential);
      
      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        imageUrl: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name
      };

      // Create session
      const session = this.createSession(googleUser, credential);
      
      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user: googleUser,
        token: credential,
        expiresAt: new Date(payload.exp * 1000)
      };

      // Store auth state
      this.saveAuthState();

      // Notify listeners
      this.notifyAuthChange(googleUser);

      // Create or update account
      this.syncWithAccountService(googleUser);

      // Track sign-in
      const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
      if (analyticsService) {
        analyticsService.trackEvent('google_sign_in', {
          userId: googleUser.id,
          email: googleUser.email
        });
      }

      console.log(`🔐 User signed in: ${googleUser.email}`);
    } catch (error) {
      console.error('Failed to handle credential response:', error);
    }
  }

  /**
   * Sign in with Google
   */
  signIn(): void {
    if (!this.isInitialized || !window.google?.accounts?.id) {
      console.error('Google Auth not initialized');
      return;
    }

    // Trigger Google One Tap
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        // Fallback to button sign-in
        this.showSignInButton();
      } else if (notification.isSkippedMoment()) {
        console.log('One Tap skipped:', notification.getSkippedReason());
      }
    });
  }

  /**
   * Sign out
   */
  signOut(): void {
    if (!this.authState.isAuthenticated) return;

    const userId = this.authState.user?.id;

    // Clear auth state
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null
    };

    // Clear sessions
    if (userId) {
      this.sessions.delete(userId);
    }

    // Clear stored auth
    this.clearStoredAuth();

    // Disable auto sign-in
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Notify listeners
    this.notifyAuthChange(null);

    // Track sign-out
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('google_sign_out', { userId });
    }

    console.log('🔐 User signed out');
  }

  /**
   * Get current user
   */
  getCurrentUser(): GoogleUser | null {
    return this.authState.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.isTokenValid(this.authState.token);
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return this.authState.token;
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<boolean> {
    if (!this.authState.user) return false;

    try {
      // In a real implementation, this would refresh the token with Google
      console.log('🔄 Refreshing auth token...');
      
      // For now, just re-prompt for sign-in
      this.signIn();
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  /**
   * Register auth change callback
   */
  onAuthChange(callback: (user: GoogleUser | null) => void): () => void {
    this.authCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): AuthSession[] {
    return Array.from(this.sessions.values())
      .filter(session => new Date(session.expiresAt) > new Date());
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Render sign-in button
   */
  private renderSignInButton(containerId = 'google-signin-button'): void {
    if (typeof document === 'undefined') return;

    let container = document.getElementById(containerId);
    
    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
      `;
      document.body.appendChild(container);
    }

    // Render Google Sign-In button
    window.google.accounts.id.renderButton(
      container,
      {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
  }

  /**
   * Show sign-in button popup
   */
  private showSignInButton(): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 15px;
      text-align: center;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Sign in to TinkyBink';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'popup-google-signin';
    container.appendChild(buttonContainer);

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    `;
    closeButton.onclick = () => overlay.remove();
    container.appendChild(closeButton);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Render button in popup
    this.renderSignInButton('popup-google-signin');
  }

  /**
   * Decode JWT token
   */
  private decodeJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
      const payload = this.decodeJWT(token);
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  /**
   * Create auth session
   */
  private createSession(user: GoogleUser, token: string): AuthSession {
    const payload = this.decodeJWT(token);
    
    const session: AuthSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      device: navigator.userAgent,
      ipAddress: 'unknown' // Would be set by backend
    };

    this.sessions.set(user.id, session);
    return session;
  }

  /**
   * Restore session from stored token
   */
  private restoreSession(token: string): void {
    try {
      const payload = this.decodeJWT(token);
      
      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        imageUrl: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name
      };

      this.authState = {
        isAuthenticated: true,
        user: googleUser,
        token,
        expiresAt: new Date(payload.exp * 1000)
      };

      this.notifyAuthChange(googleUser);
      console.log(`🔐 Restored session for ${googleUser.email}`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Sync with account service
   */
  private async syncWithAccountService(googleUser: GoogleUser): Promise<void> {
    const accountService = (window as any).moduleSystem?.get('AccountService');
    if (!accountService) return;

    try {
      // Check if account exists
      let profile = await accountService.getProfile(googleUser.id);
      
      if (!profile) {
        // Create new account
        await accountService.createAccount({
          email: googleUser.email,
          name: googleUser.name,
          password: 'google-auth', // Placeholder for Google auth
          role: 'patient' // Default role
        });
      }

      // Auto-login to account service
      await accountService.login(googleUser.email, 'google-auth');
    } catch (error) {
      console.error('Failed to sync with account service:', error);
    }
  }

  /**
   * Notify auth change listeners
   */
  private notifyAuthChange(user: GoogleUser | null): void {
    this.authCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    });

    // Emit global event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { user }
    }));
  }

  /**
   * Load auth state from storage
   */
  private loadAuthState(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedAuth = localStorage.getItem('google_auth_state');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        if (this.isTokenValid(authData.token)) {
          this.authState = authData;
          this.authState.expiresAt = new Date(authData.expiresAt);
        } else {
          this.clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Save auth state to storage
   */
  private saveAuthState(): void {
    if (typeof window === 'undefined') return;

    try {
      const authData = {
        ...this.authState,
        expiresAt: this.authState.expiresAt?.toISOString()
      };
      
      localStorage.setItem('google_auth_state', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  /**
   * Get stored token
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedAuth = localStorage.getItem('google_auth_state');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        return authData.token;
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Clear stored auth
   */
  private clearStoredAuth(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('google_auth_state');
  }
}

// Export singleton getter function
export function getAuthService(): AuthService {
  return AuthService.getInstance();
}