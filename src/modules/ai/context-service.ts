/**
 * Context Service
 * Module 50: Intelligent context awareness and adaptation
 */

interface ContextData {
  id: string;
  timestamp: string;
  type: ContextType;
  value: any;
  confidence: number;
  source: string;
}

type ContextType = 
  | 'time_of_day'
  | 'location'
  | 'activity'
  | 'emotional_state'
  | 'communication_partner'
  | 'environment'
  | 'physical_state'
  | 'social_situation'
  | 'device_state'
  | 'user_preference';

interface ContextState {
  currentContext: Map<ContextType, ContextData>;
  history: ContextData[];
  predictions: ContextPrediction[];
  activeRules: ContextRule[];
}

interface ContextPrediction {
  type: ContextType;
  predictedValue: any;
  probability: number;
  timeframe: string;
  basedOn: string[];
}

interface ContextRule {
  id: string;
  name: string;
  description: string;
  conditions: ContextCondition[];
  actions: ContextAction[];
  priority: number;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

interface ContextCondition {
  type: ContextType;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'matches';
  value: any;
  weight?: number;
}

interface ContextAction {
  type: 'suggest_board' | 'adjust_ui' | 'notify' | 'speak' | 'custom';
  target?: string;
  parameters?: any;
}

interface ContextPattern {
  id: string;
  name: string;
  contexts: ContextData[];
  frequency: number;
  lastSeen: string;
  confidence: number;
}

export class ContextService {
  private static instance: ContextService;
  private contextState: ContextState = {
    currentContext: new Map(),
    history: [],
    predictions: [],
    activeRules: []
  };
  private rules: Map<string, ContextRule> = new Map();
  private patterns: Map<string, ContextPattern> = new Map();
  private sensors: Map<string, ContextSensor> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private historyLimit = 1000;

  private constructor() {
    this.initializeDefaultRules();
    this.initializeSensors();
  }

  static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  initialize(): void {
    console.log('🧠 Context Service ready - Intelligent context awareness');
    this.loadContextData();
    this.startContextMonitoring();
    this.detectInitialContext();
  }

  /**
   * Initialize default context rules
   */
  private initializeDefaultRules(): void {
    // Morning routine rule
    this.addRule({
      id: 'morning_routine',
      name: 'Morning Routine',
      description: 'Suggest morning activities between 6-9 AM',
      conditions: [
        { type: 'time_of_day', operator: 'between', value: { start: 6, end: 9 } }
      ],
      actions: [
        { type: 'suggest_board', target: 'morning_routine' },
        { type: 'speak', parameters: { text: 'Good morning!' } }
      ],
      priority: 5,
      enabled: true,
      triggerCount: 0
    });

    // Meal time rule
    this.addRule({
      id: 'meal_time',
      name: 'Meal Time',
      description: 'Suggest food-related boards during meal times',
      conditions: [
        { type: 'time_of_day', operator: 'matches', value: [7, 12, 18] }
      ],
      actions: [
        { type: 'suggest_board', target: 'food_choices' },
        { type: 'notify', parameters: { message: 'Time to eat!' } }
      ],
      priority: 4,
      enabled: true,
      triggerCount: 0
    });

    // Low battery rule
    this.addRule({
      id: 'low_battery',
      name: 'Low Battery Warning',
      description: 'Warn when device battery is low',
      conditions: [
        { type: 'device_state', operator: 'less', value: { battery: 20 } }
      ],
      actions: [
        { type: 'notify', parameters: { message: 'Battery low! Please charge device.' } },
        { type: 'adjust_ui', parameters: { reducePower: true } }
      ],
      priority: 8,
      enabled: true,
      triggerCount: 0
    });

    // High stress detection
    this.addRule({
      id: 'stress_support',
      name: 'Stress Support',
      description: 'Provide support during stressful situations',
      conditions: [
        { type: 'emotional_state', operator: 'equals', value: 'stressed' },
        { type: 'activity', operator: 'equals', value: 'rapid_selections' }
      ],
      actions: [
        { type: 'suggest_board', target: 'calming_activities' },
        { type: 'adjust_ui', parameters: { simplify: true } }
      ],
      priority: 7,
      enabled: true,
      triggerCount: 0
    });
  }

  /**
   * Initialize context sensors
   */
  private initializeSensors(): void {
    // Time sensor
    this.sensors.set('time', {
      id: 'time',
      type: 'time_of_day',
      update: () => {
        const now = new Date();
        return {
          hour: now.getHours(),
          minute: now.getMinutes(),
          dayOfWeek: now.getDay(),
          timeString: now.toTimeString().split(' ')[0]
        };
      },
      interval: 60000 // Update every minute
    });

    // Activity sensor
    this.sensors.set('activity', {
      id: 'activity',
      type: 'activity',
      update: () => {
        const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
        const recentActions = analyticsService?.getRecentActions(5) || [];
        
        return this.inferActivity(recentActions);
      },
      interval: 30000 // Update every 30 seconds
    });

    // Device state sensor
    this.sensors.set('device', {
      id: 'device',
      type: 'device_state',
      update: async () => {
        const battery = await this.getBatteryLevel();
        const network = navigator.onLine;
        const memory = (performance as any).memory;
        
        return {
          battery,
          network,
          memoryUsage: memory ? memory.usedJSHeapSize / memory.totalJSHeapSize : 0,
          screenSize: `${window.innerWidth}x${window.innerHeight}`
        };
      },
      interval: 300000 // Update every 5 minutes
    });

    // Environment sensor
    this.sensors.set('environment', {
      id: 'environment',
      type: 'environment',
      update: () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isQuiet = this.detectQuietEnvironment();
        
        return {
          colorScheme: isDark ? 'dark' : 'light',
          noise: isQuiet ? 'quiet' : 'normal',
          ambientLight: this.getAmbientLight()
        };
      },
      interval: 120000 // Update every 2 minutes
    });
  }

  /**
   * Update context
   */
  updateContext(type: ContextType, value: any, source = 'manual'): void {
    const contextData: ContextData = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      value,
      confidence: source === 'manual' ? 1.0 : 0.8,
      source
    };

    // Update current context
    this.contextState.currentContext.set(type, contextData);

    // Add to history
    this.contextState.history.unshift(contextData);
    if (this.contextState.history.length > this.historyLimit) {
      this.contextState.history = this.contextState.history.slice(0, this.historyLimit);
    }

    // Check rules
    this.evaluateRules();

    // Update patterns
    this.updatePatterns(contextData);

    // Generate predictions
    this.generatePredictions();

    // Emit context change event
    this.emitContextChange(type, value);

    console.log(`📍 Context updated: ${type} = ${JSON.stringify(value)}`);
  }

  /**
   * Get current context
   */
  getCurrentContext(type?: ContextType): any {
    if (type) {
      return this.contextState.currentContext.get(type)?.value;
    }
    
    const context: any = {};
    this.contextState.currentContext.forEach((data, key) => {
      context[key] = data.value;
    });
    
    return context;
  }

  /**
   * Get context history
   */
  getHistory(type?: ContextType, limit = 50): ContextData[] {
    let history = this.contextState.history;
    
    if (type) {
      history = history.filter(h => h.type === type);
    }
    
    return history.slice(0, limit);
  }

  /**
   * Add context rule
   */
  addRule(rule: ContextRule): void {
    this.rules.set(rule.id, rule);
    this.saveRules();
  }

  /**
   * Remove context rule
   */
  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.saveRules();
    }
    return deleted;
  }

  /**
   * Get all rules
   */
  getRules(onlyEnabled = false): ContextRule[] {
    let rules = Array.from(this.rules.values());
    
    if (onlyEnabled) {
      rules = rules.filter(r => r.enabled);
    }
    
    return rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Toggle rule
   */
  toggleRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = !rule.enabled;
    this.saveRules();
    
    return rule.enabled;
  }

  /**
   * Get context predictions
   */
  getPredictions(): ContextPrediction[] {
    return [...this.contextState.predictions];
  }

  /**
   * Get context patterns
   */
  getPatterns(minConfidence = 0.5): ContextPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.confidence >= minConfidence)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get context suggestions
   */
  getContextSuggestions(): {
    boards: string[];
    tiles: string[];
    actions: string[];
    settings: any;
  } {
    const suggestions = {
      boards: [],
      tiles: [],
      actions: [],
      settings: {}
    };

    // Get suggestions based on current context
    const timeOfDay = this.getCurrentContext('time_of_day');
    const activity = this.getCurrentContext('activity');
    const emotionalState = this.getCurrentContext('emotional_state');

    // Time-based suggestions
    if (timeOfDay?.hour >= 6 && timeOfDay?.hour < 9) {
      suggestions.boards.push('morning_routine');
      suggestions.tiles.push('good_morning', 'breakfast', 'get_dressed');
    } else if (timeOfDay?.hour >= 20) {
      suggestions.boards.push('bedtime_routine');
      suggestions.tiles.push('pajamas', 'brush_teeth', 'goodnight');
    }

    // Activity-based suggestions
    if (activity === 'communication') {
      suggestions.boards.push('quick_phrases', 'social_chat');
    } else if (activity === 'learning') {
      suggestions.boards.push('educational_games', 'vocabulary');
    }

    // Emotional state suggestions
    if (emotionalState === 'stressed' || emotionalState === 'anxious') {
      suggestions.boards.push('calming_activities');
      suggestions.actions.push('play_calming_music', 'breathing_exercise');
      suggestions.settings.simplifiedUI = true;
    }

    return suggestions;
  }

  /**
   * Export context data
   */
  exportContextData(): string {
    const data = {
      currentContext: Object.fromEntries(this.contextState.currentContext),
      history: this.contextState.history.slice(0, 100),
      rules: Array.from(this.rules.values()),
      patterns: Array.from(this.patterns.values())
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Private helper methods
  private startContextMonitoring(): void {
    // Update context from sensors
    this.sensors.forEach(sensor => {
      const updateSensor = async () => {
        try {
          const value = await sensor.update();
          this.updateContext(sensor.type, value, 'sensor');
        } catch (error) {
          console.error(`Sensor ${sensor.id} failed:`, error);
        }
      };

      // Initial update
      updateSensor();

      // Schedule periodic updates
      setInterval(updateSensor, sensor.interval);
    });
  }

  private detectInitialContext(): void {
    // Detect initial time context
    const now = new Date();
    this.updateContext('time_of_day', {
      hour: now.getHours(),
      minute: now.getMinutes(),
      period: this.getTimePeriod(now.getHours())
    }, 'system');

    // Detect device context
    this.updateContext('device_state', {
      platform: navigator.platform,
      touchEnabled: 'ontouchstart' in window,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    }, 'system');

    // Detect location (if permitted)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.updateContext('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }, 'sensor');
        },
        error => {
          console.log('Location access denied');
        }
      );
    }
  }

  private evaluateRules(): void {
    const enabledRules = this.getRules(true);
    this.contextState.activeRules = [];

    enabledRules.forEach(rule => {
      if (this.evaluateConditions(rule.conditions)) {
        this.contextState.activeRules.push(rule);
        this.executeActions(rule.actions);
        
        rule.lastTriggered = new Date().toISOString();
        rule.triggerCount++;
        
        console.log(`🎯 Context rule triggered: ${rule.name}`);
      }
    });
  }

  private evaluateConditions(conditions: ContextCondition[]): boolean {
    return conditions.every(condition => {
      const contextData = this.contextState.currentContext.get(condition.type);
      if (!contextData) return false;

      const value = contextData.value;
      
      switch (condition.operator) {
        case 'equals':
          return JSON.stringify(value) === JSON.stringify(condition.value);
        
        case 'contains':
          return JSON.stringify(value).includes(JSON.stringify(condition.value));
        
        case 'greater':
          return value > condition.value;
        
        case 'less':
          return value < condition.value;
        
        case 'between':
          return value >= condition.value.start && value <= condition.value.end;
        
        case 'matches':
          if (Array.isArray(condition.value)) {
            return condition.value.some(v => 
              typeof value === 'object' ? value.hour === v : value === v
            );
          }
          return false;
        
        default:
          return false;
      }
    });
  }

  private executeActions(actions: ContextAction[]): void {
    actions.forEach(action => {
      switch (action.type) {
        case 'suggest_board':
          if (action.target) {
            const boardManager = (window as any).moduleSystem?.get('BoardManager');
            boardManager?.suggestBoard(action.target);
          }
          break;

        case 'adjust_ui':
          if (action.parameters) {
            const uiEffects = (window as any).moduleSystem?.get('UIEffectsService');
            uiEffects?.adjustUI(action.parameters);
          }
          break;

        case 'notify':
          if (action.parameters?.message) {
            this.showNotification(action.parameters.message);
          }
          break;

        case 'speak':
          if (action.parameters?.text) {
            const speechService = (window as any).moduleSystem?.get('SpeechService');
            speechService?.speak(action.parameters.text);
          }
          break;

        case 'custom':
          window.dispatchEvent(new CustomEvent('contextAction', {
            detail: action
          }));
          break;
      }
    });
  }

  private updatePatterns(contextData: ContextData): void {
    // Look for repeating patterns in history
    const recentHistory = this.contextState.history.slice(0, 50);
    const pattern = this.findPattern(recentHistory);
    
    if (pattern) {
      const existingPattern = this.patterns.get(pattern.id);
      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.lastSeen = new Date().toISOString();
        existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.05);
      } else {
        this.patterns.set(pattern.id, pattern);
      }
    }
  }

  private findPattern(history: ContextData[]): ContextPattern | null {
    // Simple pattern detection - look for repeated sequences
    if (history.length < 3) return null;

    const sequence = history.slice(0, 3).map(h => `${h.type}:${JSON.stringify(h.value)}`).join('|');
    const patternId = this.hashString(sequence);

    return {
      id: patternId,
      name: `Pattern ${patternId.substr(0, 6)}`,
      contexts: history.slice(0, 3),
      frequency: 1,
      lastSeen: new Date().toISOString(),
      confidence: 0.5
    };
  }

  private generatePredictions(): void {
    this.contextState.predictions = [];

    // Time-based predictions
    const currentTime = this.getCurrentContext('time_of_day');
    if (currentTime) {
      // Predict next activity based on time
      if (currentTime.hour === 11) {
        this.contextState.predictions.push({
          type: 'activity',
          predictedValue: 'lunch',
          probability: 0.8,
          timeframe: '1 hour',
          basedOn: ['time_of_day', 'historical_patterns']
        });
      }
    }

    // Pattern-based predictions
    const topPatterns = this.getPatterns(0.7);
    topPatterns.forEach(pattern => {
      if (pattern.contexts.length > 0) {
        const nextContext = pattern.contexts[0];
        this.contextState.predictions.push({
          type: nextContext.type,
          predictedValue: nextContext.value,
          probability: pattern.confidence,
          timeframe: '15 minutes',
          basedOn: [`pattern_${pattern.id}`]
        });
      }
    });
  }

  private emitContextChange(type: ContextType, value: any): void {
    window.dispatchEvent(new CustomEvent('contextChanged', {
      detail: { type, value, timestamp: new Date().toISOString() }
    }));
  }

  private inferActivity(recentActions: any[]): string {
    // Analyze recent actions to infer activity
    if (recentActions.length === 0) return 'idle';

    const actionTypes = recentActions.map(a => a.type);
    
    if (actionTypes.filter(t => t === 'tile_select').length > 3) {
      return 'communication';
    }
    
    if (actionTypes.includes('game_start')) {
      return 'playing';
    }
    
    if (actionTypes.includes('board_create') || actionTypes.includes('tile_edit')) {
      return 'customizing';
    }

    return 'browsing';
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const battery = await (navigator as any).getBattery();
      return Math.round(battery.level * 100);
    } catch {
      return 100; // Assume full battery if API not available
    }
  }

  private detectQuietEnvironment(): boolean {
    // Would use Web Audio API to detect ambient noise
    // For now, return based on time
    const hour = new Date().getHours();
    return hour >= 22 || hour < 7;
  }

  private getAmbientLight(): string {
    // Would use Ambient Light Sensor API if available
    // For now, estimate based on time
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'bright';
    if (hour >= 18 && hour < 20) return 'dim';
    return 'dark';
  }

  private getTimePeriod(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private showNotification(message: string): void {
    const notificationService = (window as any).moduleSystem?.get('NotificationService');
    if (notificationService) {
      notificationService.show({
        title: 'Context Alert',
        message,
        type: 'info'
      });
    } else {
      console.log(`📢 ${message}`);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private loadContextData(): void {
    if (typeof window === 'undefined') return;

    try {
      const rulesData = localStorage.getItem('context_rules');
      if (rulesData) {
        const rules = JSON.parse(rulesData);
        rules.forEach((rule: ContextRule) => {
          this.rules.set(rule.id, rule);
        });
      }

      const patternsData = localStorage.getItem('context_patterns');
      if (patternsData) {
        const patterns = JSON.parse(patternsData);
        patterns.forEach((pattern: ContextPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
      }
    } catch (error) {
      console.error('Failed to load context data:', error);
    }
  }

  private saveRules(): void {
    if (typeof window === 'undefined') return;

    try {
      const rules = Array.from(this.rules.values());
      localStorage.setItem('context_rules', JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  }
}

// Type definitions
interface ContextSensor {
  id: string;
  type: ContextType;
  update: () => any | Promise<any>;
  interval: number;
}

// Export singleton getter function
export function getContextService(): ContextService {
  return ContextService.getInstance();
}