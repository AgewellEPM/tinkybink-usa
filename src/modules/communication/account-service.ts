/**
 * Account Service
 * Module 35: User account management, profiles, and preferences
 */

interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: 'patient' | 'therapist' | 'parent' | 'admin';
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: UserAddress;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences: UserPreferences;
  subscription: SubscriptionInfo;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

interface UserAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

interface MedicalInfo {
  diagnosis?: string[];
  medications?: string[];
  allergies?: string[];
  therapist?: string;
  clinic?: string;
  insuranceProvider?: string;
  memberNumber?: string;
}

interface UserPreferences {
  language: string;
  voiceSpeed: number;
  voicePitch: number;
  volume: number;
  theme: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sessionReminders: boolean;
  progressUpdates: boolean;
  gameAchievements: boolean;
  systemUpdates: boolean;
}

interface PrivacySettings {
  shareProgressWithTherapist: boolean;
  shareUsageAnalytics: boolean;
  allowSessionRecording: boolean;
  profileVisibility: 'private' | 'therapist-only' | 'family-only' | 'public';
}

interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
  features: string[];
}

interface PaymentMethod {
  type: 'card' | 'paypal' | 'insurance';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

interface AccountActivity {
  id: string;
  userId: string;
  action: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AccountService {
  private static instance: AccountService;
  private currentProfile: UserProfile | null = null;
  private profileCache: Map<string, UserProfile> = new Map();
  private activityLog: AccountActivity[] = [];
  private isAuthenticated = false;
  private sessionExpiry: Date | null = null;

  private constructor() {}

  static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  initialize(): void {
    console.log('👤 Account Service ready - User profile and preferences management');
    this.loadCurrentProfile();
    this.setupSessionMonitoring();
    this.checkSubscriptionStatus();
  }

  /**
   * Create new user account
   */
  async createAccount(accountData: {
    email: string;
    name: string;
    password: string;
    role: UserProfile['role'];
    dateOfBirth?: string;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Validate email format
      if (!this.isValidEmail(accountData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if email already exists
      if (await this.emailExists(accountData.email)) {
        return { success: false, error: 'Email already registered' };
      }

      // Generate user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user profile
      const profile: UserProfile = {
        id: userId,
        email: accountData.email,
        name: accountData.name,
        role: accountData.role,
        dateOfBirth: accountData.dateOfBirth,
        preferences: this.getDefaultPreferences(),
        subscription: this.getDefaultSubscription(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      };

      // Store profile
      await this.saveProfile(profile);

      // Log account creation
      this.logActivity('account_created', {
        userId,
        role: accountData.role,
        email: accountData.email
      });

      // Track analytics
      const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
      if (analyticsService) {
        analyticsService.trackEvent('account_created', {
          userId,
          role: accountData.role,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`👤 Created account for ${accountData.email}`);
      return { success: true, userId };

    } catch (error) {
      console.error('Account creation failed:', error);
      return { success: false, error: 'Account creation failed' };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Merge updates
      const updatedProfile = { ...profile, ...updates };

      // Validate critical fields
      if (updates.email && !this.isValidEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      // Save updated profile
      await this.saveProfile(updatedProfile);

      // Update current profile if it's the active user
      if (this.currentProfile?.id === userId) {
        this.currentProfile = updatedProfile;
      }

      // Log profile update
      this.logActivity('profile_updated', {
        userId,
        updatedFields: Object.keys(updates)
      });

      console.log(`👤 Updated profile for ${userId}`);
      return true;

    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      profile.preferences = { ...profile.preferences, ...preferences };
      await this.saveProfile(profile);

      // Apply preferences to current session
      if (this.currentProfile?.id === userId) {
        this.currentProfile = profile;
        this.applyPreferences(profile.preferences);
      }

      this.logActivity('preferences_updated', {
        userId,
        updatedPreferences: Object.keys(preferences)
      });

      return true;
    } catch (error) {
      console.error('Preferences update failed:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    // Load from storage
    try {
      const profileData = localStorage.getItem(`profile_${userId}`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        this.profileCache.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }

    return null;
  }

  /**
   * Get current user profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      // In production, this would authenticate against backend
      const profile = await this.authenticateUser(email, password);
      
      if (!profile) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Set current profile
      this.currentProfile = profile;
      this.isAuthenticated = true;
      this.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update last login
      profile.lastLogin = new Date().toISOString();
      await this.saveProfile(profile);

      // Apply user preferences
      this.applyPreferences(profile.preferences);

      // Store session
      this.storeSession(profile);

      // Log login
      this.logActivity('login', { userId: profile.id, email });

      console.log(`👤 User logged in: ${email}`);
      return { success: true, profile };

    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    if (this.currentProfile) {
      this.logActivity('logout', { userId: this.currentProfile.id });
    }

    this.currentProfile = null;
    this.isAuthenticated = false;
    this.sessionExpiry = null;

    // Clear session storage
    this.clearSession();

    // Reset to default preferences
    this.applyPreferences(this.getDefaultPreferences());

    console.log('👤 User logged out');

    // Emit logout event
    window.dispatchEvent(new CustomEvent('userLogout'));
  }

  /**
   * Delete account
   */
  async deleteAccount(userId: string, password: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Verify password (in production)
      if (!await this.verifyPassword(profile.email, password)) {
        throw new Error('Invalid password');
      }

      // Mark account as inactive
      profile.isActive = false;
      await this.saveProfile(profile);

      // Log account deletion
      this.logActivity('account_deleted', { userId, email: profile.email });

      // If deleting current user, logout
      if (this.currentProfile?.id === userId) {
        this.logout();
      }

      console.log(`👤 Account deleted: ${userId}`);
      return true;

    } catch (error) {
      console.error('Account deletion failed:', error);
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Verify current password
      if (!await this.verifyPassword(profile.email, currentPassword)) {
        throw new Error('Invalid current password');
      }

      // Validate new password
      if (!this.isValidPassword(newPassword)) {
        throw new Error('Password does not meet requirements');
      }

      // Update password (in production, hash and store securely)
      await this.updatePassword(profile.email, newPassword);

      this.logActivity('password_changed', { userId });

      console.log(`👤 Password changed for ${userId}`);
      return true;

    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(userId: string, plan: SubscriptionInfo['plan']): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      const subscription: SubscriptionInfo = {
        plan,
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        features: this.getPlanFeatures(plan)
      };

      profile.subscription = subscription;
      await this.saveProfile(profile);

      this.logActivity('subscription_updated', {
        userId,
        plan,
        previousPlan: this.currentProfile?.subscription.plan
      });

      console.log(`👤 Subscription updated to ${plan} for ${userId}`);
      return true;

    } catch (error) {
      console.error('Subscription update failed:', error);
      return false;
    }
  }

  /**
   * Export user data
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get additional data from other services
      const gameTrackingService = (window as any).moduleSystem?.get('GameTrackingService');
      const smartDefaultsService = (window as any).moduleSystem?.get('SmartDefaultsService');

      const exportData = {
        profile: this.sanitizeProfileForExport(profile),
        activityLog: this.activityLog.filter(a => a.userId === userId),
        gameData: gameTrackingService?.exportUserData() || null,
        smartDefaults: smartDefaultsService?.exportUserData() || null,
        exportedAt: new Date().toISOString()
      };

      this.logActivity('data_exported', { userId });

      return exportData;

    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }

  /**
   * Import user data
   */
  async importUserData(userId: string, data: any): Promise<boolean> {
    try {
      if (data.profile) {
        await this.updateProfile(userId, data.profile);
      }

      // Import data to other services
      if (data.gameData) {
        const gameTrackingService = (window as any).moduleSystem?.get('GameTrackingService');
        gameTrackingService?.importUserData(data.gameData);
      }

      if (data.smartDefaults) {
        const smartDefaultsService = (window as any).moduleSystem?.get('SmartDefaultsService');
        smartDefaultsService?.importUserData(data.smartDefaults);
      }

      this.logActivity('data_imported', { userId });

      console.log(`👤 Data imported for ${userId}`);
      return true;

    } catch (error) {
      console.error('Data import failed:', error);
      return false;
    }
  }

  /**
   * Get account activity log
   */
  getActivityLog(userId: string, limit = 50): AccountActivity[] {
    return this.activityLog
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated && this.sessionExpiry ? new Date() < this.sessionExpiry : false;
  }

  /**
   * Get subscription features
   */
  getSubscriptionFeatures(userId?: string): string[] {
    const profile = userId ? this.profileCache.get(userId) : this.currentProfile;
    return profile?.subscription.features || this.getPlanFeatures('free');
  }

  /**
   * Check if user has feature access
   */
  hasFeatureAccess(feature: string, userId?: string): boolean {
    const features = this.getSubscriptionFeatures(userId);
    return features.includes(feature) || features.includes('all');
  }

  // Private helper methods
  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      volume: 0.8,
      theme: 'default',
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      soundEffects: true,
      notifications: {
        email: true,
        push: true,
        sessionReminders: true,
        progressUpdates: true,
        gameAchievements: true,
        systemUpdates: false
      },
      privacy: {
        shareProgressWithTherapist: true,
        shareUsageAnalytics: true,
        allowSessionRecording: false,
        profileVisibility: 'therapist-only'
      }
    };
  }

  private getDefaultSubscription(): SubscriptionInfo {
    return {
      plan: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      autoRenew: false,
      features: this.getPlanFeatures('free')
    };
  }

  private getPlanFeatures(plan: SubscriptionInfo['plan']): string[] {
    const features = {
      free: ['basic_tiles', 'speech_synthesis', 'simple_games'],
      basic: ['basic_tiles', 'speech_synthesis', 'all_games', 'custom_tiles', 'basic_analytics'],
      professional: ['all_tiles', 'speech_synthesis', 'all_games', 'custom_tiles', 'full_analytics', 'collaboration', 'session_recording', 'billing_integration'],
      enterprise: ['all']
    };

    return features[plan] || features.free;
  }

  private async authenticateUser(email: string, password: string): Promise<UserProfile | null> {
    // Mock authentication - in production, this would call backend API
    try {
      // Load all profiles and find matching email
      const profiles = await this.getAllProfiles();
      const profile = profiles.find(p => p.email === email && p.isActive);
      
      if (profile && await this.verifyPassword(email, password)) {
        return profile;
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }

    return null;
  }

  private async getAllProfiles(): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];
    
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('profile_')) {
          try {
            const profileData = localStorage.getItem(key);
            if (profileData) {
              profiles.push(JSON.parse(profileData));
            }
          } catch (error) {
            console.error('Error loading profile:', error);
          }
        }
      }
    }

    return profiles;
  }

  private async emailExists(email: string): Promise<boolean> {
    const profiles = await this.getAllProfiles();
    return profiles.some(p => p.email === email);
  }

  private async verifyPassword(email: string, password: string): Promise<boolean> {
    // Mock password verification - in production, use proper hashing
    return password.length >= 6; // Simple validation for demo
  }

  private async updatePassword(email: string, newPassword: string): Promise<void> {
    // Mock password update - in production, hash and store securely
    console.log(`Password updated for ${email}`);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    // At least 6 characters, contains letter and number
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  }

  private async saveProfile(profile: UserProfile): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`profile_${profile.id}`, JSON.stringify(profile));
      this.profileCache.set(profile.id, profile);
    }
  }

  private loadCurrentProfile(): void {
    if (typeof window === 'undefined') return;

    try {
      const sessionData = localStorage.getItem('current_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.currentProfile = session.profile;
          this.isAuthenticated = true;
          this.sessionExpiry = new Date(session.expiresAt);
          
          // Apply user preferences
          this.applyPreferences(this.currentProfile.preferences);
          
          console.log(`👤 Restored session for ${this.currentProfile.email}`);
        } else {
          // Session expired
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  private storeSession(profile: UserProfile): void {
    if (typeof window === 'undefined') return;

    const session = {
      profile,
      expiresAt: this.sessionExpiry?.toISOString()
    };

    localStorage.setItem('current_session', JSON.stringify(session));
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current_session');
    }
  }

  private applyPreferences(preferences: UserPreferences): void {
    // Apply language
    const languageService = (window as any).moduleSystem?.get('LanguageService');
    if (languageService) {
      languageService.setLanguage(preferences.language);
    }

    // Apply speech settings
    const speechService = (window as any).moduleSystem?.get('SpeechService');
    if (speechService) {
      speechService.setVoiceSettings({
        rate: preferences.voiceSpeed,
        pitch: preferences.voicePitch,
        volume: preferences.volume
      });
    }

    // Apply theme
    document.documentElement.setAttribute('data-theme', preferences.theme);
    document.documentElement.setAttribute('data-font-size', preferences.fontSize);
    
    if (preferences.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    }
    
    if (preferences.reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }

    console.log('👤 Applied user preferences');
  }

  private setupSessionMonitoring(): void {
    // Check session validity every 5 minutes
    setInterval(() => {
      if (this.isAuthenticated && this.sessionExpiry && new Date() >= this.sessionExpiry) {
        console.log('👤 Session expired, logging out');
        this.logout();
      }
    }, 5 * 60 * 1000);
  }

  private checkSubscriptionStatus(): void {
    if (this.currentProfile?.subscription) {
      const sub = this.currentProfile.subscription;
      
      if (sub.endDate && new Date() > new Date(sub.endDate)) {
        sub.status = 'expired';
        this.saveProfile(this.currentProfile);
        
        // Emit subscription expired event
        window.dispatchEvent(new CustomEvent('subscriptionExpired', {
          detail: { userId: this.currentProfile.id, plan: sub.plan }
        }));
      }
    }
  }

  private logActivity(action: string, details: any): void {
    const activity: AccountActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentProfile?.id || 'unknown',
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.activityLog.push(activity);

    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  private getClientIP(): string {
    // In production, this would be provided by the backend
    return 'unknown';
  }

  private sanitizeProfileForExport(profile: UserProfile): any {
    const sanitized = { ...profile };
    
    // Remove sensitive information
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).securityQuestions;
    
    return sanitized;
  }
}

// Export singleton getter function
export function getAccountService(): AccountService {
  return AccountService.getInstance();
}