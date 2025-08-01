/**
 * Smart Defaults Service
 * Module 31: Intelligent default settings and predictions based on user patterns
 */

interface UserPattern {
  id: string;
  userId: string;
  context: string;
  frequency: number;
  lastUsed: string;
  timeOfDay: string;
  dayOfWeek: string;
  boardId: string;
  tileSequence: string[];
  success: boolean;
}

interface SmartDefault {
  id: string;
  type: 'tile' | 'board' | 'phrase' | 'setting';
  trigger: string;
  value: any;
  confidence: number;
  usage: number;
  lastUpdated: string;
}

interface UserPreference {
  id: string;
  category: string;
  setting: string;
  value: any;
  timestamp: string;
  source: 'manual' | 'learned' | 'inferred';
}

interface ContextualSuggestion {
  id: string;
  text: string;
  type: 'phrase' | 'tile' | 'board';
  relevance: number;
  context: string[];
  metadata: any;
}

export class SmartDefaultsService {
  private static instance: SmartDefaultsService;
  private userPatterns: Map<string, UserPattern[]> = new Map();
  private smartDefaults: Map<string, SmartDefault> = new Map();
  private userPreferences: Map<string, UserPreference[]> = new Map();
  private learningEnabled = true;
  private minPatternFrequency = 3;
  private patternExpiryDays = 30;

  private constructor() {
    this.initializeDefaults();
    this.startPatternLearning();
  }

  static getInstance(): SmartDefaultsService {
    if (!SmartDefaultsService.instance) {
      SmartDefaultsService.instance = new SmartDefaultsService();
    }
    return SmartDefaultsService.instance;
  }

  initialize(): void {
    console.log('🧠 Smart Defaults Service ready - Learning user patterns and preferences');
    this.loadUserPatterns();
    this.setupEventListeners();
  }

  /**
   * Initialize default smart suggestions
   */
  private initializeDefaults(): void {
    const commonDefaults: SmartDefault[] = [
      {
        id: 'morning_greeting',
        type: 'phrase',
        trigger: 'time:morning',
        value: 'Good morning',
        confidence: 0.8,
        usage: 0,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mealtime_request',
        type: 'phrase',
        trigger: 'time:mealtime',
        value: 'I am hungry',
        confidence: 0.9,
        usage: 0,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'bathroom_need',
        type: 'tile',
        trigger: 'frequent_need',
        value: 'bathroom',
        confidence: 0.95,
        usage: 0,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'bedtime_routine',
        type: 'phrase',
        trigger: 'time:evening',
        value: 'Good night',
        confidence: 0.85,
        usage: 0,
        lastUpdated: new Date().toISOString()
      }
    ];

    commonDefaults.forEach(defaultItem => {
      this.smartDefaults.set(defaultItem.id, defaultItem);
    });
  }

  /**
   * Start learning from user patterns
   */
  private startPatternLearning(): void {
    // Learn from tile clicks
    if (typeof window !== 'undefined') {
      window.addEventListener('tileClick', (event: any) => {
        if (this.learningEnabled) {
          this.recordTilePattern(event.detail);
        }
      });

      // Learn from board changes
      window.addEventListener('boardChange', (event: any) => {
        if (this.learningEnabled) {
          this.recordBoardPattern(event.detail);
        }
      });

      // Learn from settings changes
      window.addEventListener('settingsChange', (event: any) => {
        if (this.learningEnabled) {
          this.recordPreference(event.detail);
        }
      });
    }
  }

  /**
   * Record tile usage pattern
   */
  private recordTilePattern(tileData: any): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const now = new Date();
    const context = this.getCurrentContext();
    
    const pattern: UserPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      context,
      frequency: 1,
      lastUsed: now.toISOString(),
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.getDay().toString(),
      boardId: tileData.boardId || 'main',
      tileSequence: [tileData.tileId],
      success: true
    };

    // Check for existing similar pattern
    const userPatterns = this.userPatterns.get(userId) || [];
    const existingPattern = userPatterns.find(p => 
      p.context === context && 
      p.timeOfDay === pattern.timeOfDay &&
      p.tileSequence.join(',') === pattern.tileSequence.join(',')
    );

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastUsed = now.toISOString();
    } else {
      userPatterns.push(pattern);
    }

    this.userPatterns.set(userId, userPatterns);
    this.saveUserPatterns();

    // Generate smart defaults if pattern is frequent enough
    if (existingPattern && existingPattern.frequency >= this.minPatternFrequency) {
      this.generateSmartDefault(existingPattern);
    }
  }

  /**
   * Record board usage pattern
   */
  private recordBoardPattern(boardData: any): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const preference: UserPreference = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: 'board_preference',
      setting: 'preferred_board',
      value: boardData.boardId,
      timestamp: new Date().toISOString(),
      source: 'learned'
    };

    const userPrefs = this.userPreferences.get(userId) || [];
    userPrefs.push(preference);
    this.userPreferences.set(userId, userPrefs);
  }

  /**
   * Record user preference
   */
  private recordPreference(settingData: any): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const preference: UserPreference = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: settingData.category || 'general',
      setting: settingData.setting,
      value: settingData.value,
      timestamp: new Date().toISOString(),
      source: 'manual'
    };

    const userPrefs = this.userPreferences.get(userId) || [];
    userPrefs.push(preference);
    this.userPreferences.set(userId, userPrefs);
    this.saveUserPreferences();
  }

  /**
   * Generate smart default from pattern
   */
  private generateSmartDefault(pattern: UserPattern): void {
    const defaultId = `smart_${pattern.context}_${pattern.timeOfDay}`;
    
    const smartDefault: SmartDefault = {
      id: defaultId,
      type: 'tile',
      trigger: `context:${pattern.context},time:${pattern.timeOfDay}`,
      value: pattern.tileSequence[0], // Primary tile
      confidence: Math.min(0.9, pattern.frequency / 10),
      usage: pattern.frequency,
      lastUpdated: new Date().toISOString()
    };

    this.smartDefaults.set(defaultId, smartDefault);
    console.log(`🎯 Generated smart default: ${defaultId} (confidence: ${smartDefault.confidence})`);
  }

  /**
   * Get contextual suggestions
   */
  getContextualSuggestions(context: string, limit = 5): ContextualSuggestion[] {
    const userId = this.getCurrentUserId();
    const currentTime = this.getTimeOfDay(new Date());
    const suggestions: ContextualSuggestion[] = [];

    // Get suggestions from smart defaults
    for (const [id, smartDefault] of this.smartDefaults) {
      if (this.matchesTrigger(smartDefault.trigger, context, currentTime)) {
        suggestions.push({
          id,
          text: this.getDisplayText(smartDefault),
          type: smartDefault.type as any,
          relevance: smartDefault.confidence,
          context: [context, currentTime],
          metadata: { source: 'smart_default', usage: smartDefault.usage }
        });
      }
    }

    // Get suggestions from user patterns
    if (userId) {
      const userPatterns = this.userPatterns.get(userId) || [];
      const relevantPatterns = userPatterns
        .filter(p => p.context === context || p.timeOfDay === currentTime)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      relevantPatterns.forEach(pattern => {
        suggestions.push({
          id: pattern.id,
          text: this.getTileText(pattern.tileSequence[0]),
          type: 'tile',
          relevance: Math.min(0.9, pattern.frequency / 10),
          context: [pattern.context, pattern.timeOfDay],
          metadata: { source: 'user_pattern', frequency: pattern.frequency }
        });
      });
    }

    // Sort by relevance and return top suggestions
    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Get smart defaults for current context
   */
  getSmartDefaults(context?: string): SmartDefault[] {
    const currentContext = context || this.getCurrentContext();
    const currentTime = this.getTimeOfDay(new Date());

    return Array.from(this.smartDefaults.values())
      .filter(def => this.matchesTrigger(def.trigger, currentContext, currentTime))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Apply smart default to setting
   */
  applySmartDefault(defaultId: string): boolean {
    const smartDefault = this.smartDefaults.get(defaultId);
    if (!smartDefault) return false;

    try {
      switch (smartDefault.type) {
        case 'tile':
          this.selectTile(smartDefault.value);
          break;
        case 'board':
          this.switchBoard(smartDefault.value);
          break;
        case 'phrase':
          this.speakPhrase(smartDefault.value);
          break;
        case 'setting':
          this.applySetting(smartDefault.value);
          break;
      }

      // Update usage
      smartDefault.usage++;
      smartDefault.lastUpdated = new Date().toISOString();
      
      return true;
    } catch (error) {
      console.error('Failed to apply smart default:', error);
      return false;
    }
  }

  /**
   * Get user preferences for category
   */
  getUserPreferences(category: string): UserPreference[] {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    const userPrefs = this.userPreferences.get(userId) || [];
    return userPrefs.filter(pref => pref.category === category);
  }

  /**
   * Enable or disable learning
   */
  setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
    console.log(`🧠 Pattern learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear user patterns and preferences
   */
  clearUserData(userId?: string): void {
    const targetUserId = userId || this.getCurrentUserId();
    if (!targetUserId) return;

    this.userPatterns.delete(targetUserId);
    this.userPreferences.delete(targetUserId);
    
    // Clear from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`patterns_${targetUserId}`);
      localStorage.removeItem(`preferences_${targetUserId}`);
    }

    console.log(`🗑️ Cleared user data for ${targetUserId}`);
  }

  /**
   * Export user patterns and preferences
   */
  exportUserData(): any {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    return {
      patterns: this.userPatterns.get(userId) || [],
      preferences: this.userPreferences.get(userId) || [],
      smartDefaults: Array.from(this.smartDefaults.values()),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import user patterns and preferences
   */
  importUserData(data: any): boolean {
    const userId = this.getCurrentUserId();
    if (!userId || !data) return false;

    try {
      if (data.patterns) {
        this.userPatterns.set(userId, data.patterns);
      }
      
      if (data.preferences) {
        this.userPreferences.set(userId, data.preferences);
      }

      this.saveUserPatterns();
      this.saveUserPreferences();
      
      console.log('📥 Imported user data successfully');
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  // Helper methods
  private getCurrentContext(): string {
    // Determine context based on current state
    const appStore = (window as any).useAppStore?.getState();
    const currentBoard = appStore?.currentBoard;
    const currentView = appStore?.currentView;
    
    if (currentView === 'healthcare') return 'healthcare';
    if (currentView === 'eliza') return 'chat';
    if (currentBoard) return `board_${currentBoard}`;
    
    return 'home';
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getCurrentUserId(): string {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    return multiUserService?.getCurrentUser()?.id || 'anonymous';
  }

  private matchesTrigger(trigger: string, context: string, timeOfDay: string): boolean {
    const triggers = trigger.split(',');
    return triggers.some(t => {
      const [type, value] = t.split(':');
      if (type === 'context') return value === context;
      if (type === 'time') return value === timeOfDay;
      return false;
    });
  }

  private getDisplayText(smartDefault: SmartDefault): string {
    if (typeof smartDefault.value === 'string') {
      return smartDefault.value;
    }
    return smartDefault.id.replace(/_/g, ' ');
  }

  private getTileText(tileId: string): string {
    // Get tile text from tile management service
    const tileService = (window as any).moduleSystem?.get('TileManagementService');
    return tileService?.getTileText(tileId) || tileId;
  }

  private selectTile(tileId: string): void {
    // Trigger tile selection
    window.dispatchEvent(new CustomEvent('smartTileSelect', { detail: { tileId } }));
  }

  private switchBoard(boardId: string): void {
    const appStore = (window as any).useAppStore?.getState();
    if (appStore) {
      appStore.setCurrentBoard(boardId);
    }
  }

  private speakPhrase(phrase: string): void {
    const speechService = (window as any).moduleSystem?.get('SpeechService');
    if (speechService) {
      speechService.speak(phrase);
    }
  }

  private applySetting(setting: any): void {
    // Apply setting change
    window.dispatchEvent(new CustomEvent('smartSettingApply', { detail: setting }));
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Clean up expired patterns periodically
    setInterval(() => {
      this.cleanupExpiredPatterns();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private cleanupExpiredPatterns(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.patternExpiryDays);

    for (const [userId, patterns] of this.userPatterns) {
      const validPatterns = patterns.filter(p => 
        new Date(p.lastUsed) > cutoffDate
      );
      
      if (validPatterns.length !== patterns.length) {
        this.userPatterns.set(userId, validPatterns);
        console.log(`🧹 Cleaned up ${patterns.length - validPatterns.length} expired patterns for ${userId}`);
      }
    }

    this.saveUserPatterns();
  }

  private loadUserPatterns(): void {
    if (typeof window === 'undefined') return;

    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const patternsData = localStorage.getItem(`patterns_${userId}`);
      const preferencesData = localStorage.getItem(`preferences_${userId}`);

      if (patternsData) {
        const patterns = JSON.parse(patternsData);
        this.userPatterns.set(userId, patterns);
      }

      if (preferencesData) {
        const preferences = JSON.parse(preferencesData);
        this.userPreferences.set(userId, preferences);
      }
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  }

  private saveUserPatterns(): void {
    if (typeof window === 'undefined') return;

    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const patterns = this.userPatterns.get(userId);
      if (patterns) {
        localStorage.setItem(`patterns_${userId}`, JSON.stringify(patterns));
      }
    } catch (error) {
      console.error('Failed to save user patterns:', error);
    }
  }

  private saveUserPreferences(): void {
    if (typeof window === 'undefined') return;

    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const preferences = this.userPreferences.get(userId);
      if (preferences) {
        localStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences));
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }
}

// Export singleton getter function
export function getSmartDefaultsService(): SmartDefaultsService {
  return SmartDefaultsService.getInstance();
}