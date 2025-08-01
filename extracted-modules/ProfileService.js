class ProfileService {
      constructor() {
        this.currentProfile = null;
        this.profiles = new Map();
      }
      
      initialize() {
        console.log('Profile Service ready');
        this.loadProfiles();
      }
      
      loadProfiles() {
        const saved = localStorage.getItem('tinkybink_profiles');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            this.profiles = new Map(data.profiles);
            this.currentProfile = data.currentProfile;
          } catch (error) {
            console.error('Failed to parse profiles:', error);
          }
        }
      }
      
      saveProfiles() {
        localStorage.setItem('tinkybink_profiles', JSON.stringify({
          profiles: Array.from(this.profiles.entries()),
          currentProfile: this.currentProfile
        }));
      }
      
      setUser(user) {
        // Create or update profile for user
        const profile = this.profiles.get(user.id) || {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          preferences: {
            speechRate: 1,
            speechPitch: 1,
            speechVolume: 1,
            gridColumns: 3,
            tileScale: 1,
            highContrast: false
          },
          createdAt: new Date().toISOString(),
          lastAccess: new Date().toISOString()
        };
        
        profile.lastAccess = new Date().toISOString();
        this.profiles.set(user.id, profile);
        this.currentProfile = profile;
        this.saveProfiles();
        
        // Apply user preferences
        this.applyUserPreferences();
        
        // Show cloud sync option
        const cloudSection = document.getElementById('cloudSyncSection');
        if (cloudSection) cloudSection.style.display = 'block';
        
        // Load user's cloud data
        const cloudSync = moduleSystem.get('CloudSyncService');
        if (cloudSync) {
          cloudSync.loadUserData();
        }
      }
      
      clearUser() {
        this.currentProfile = null;
        const cloudSection = document.getElementById('cloudSyncSection');
        if (cloudSection) cloudSection.style.display = 'none';
      }
      
      applyUserPreferences() {
        if (!this.currentProfile) return;
        
        const prefs = this.currentProfile.preferences;
        
        // Apply speech settings
        settings.speechRate = prefs.speechRate || 1;
        settings.speechPitch = prefs.speechPitch || 1;
        settings.speechVolume = prefs.speechVolume || 1;
        
        // Apply display settings
        settings.gridColumns = prefs.gridColumns || 3;
        settings.tileScale = prefs.tileScale || 1;
        
        updateDisplaySettings();
        updateSpeechSettings();
      }
      
      updatePreference(key, value) {
        if (!this.currentProfile) return;
        
        this.currentProfile.preferences[key] = value;
        this.saveProfiles();
        
        // Sync to cloud
        const cloudSync = moduleSystem.get('CloudSyncService');
        if (cloudSync && cloudSync.syncEnabled) {
          cloudSync.syncUserData();
        }
      }
      
      getCurrentProfile() {
        return this.currentProfile;
      }
    }