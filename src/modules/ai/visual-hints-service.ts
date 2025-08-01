/**
 * Visual Hints Service
 * Module 41: AI-powered visual hints and suggestions for tiles
 */

interface VisualHint {
  id: string;
  tileId: string;
  type: 'highlight' | 'glow' | 'pulse' | 'arrow' | 'tooltip' | 'border';
  message?: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  trigger: HintTrigger;
  style?: Partial<CSSStyleDeclaration>;
  animation?: AnimationConfig;
}

interface HintTrigger {
  type: 'time' | 'idle' | 'context' | 'sequence' | 'frequency' | 'manual';
  condition?: any;
  delay?: number;
}

interface AnimationConfig {
  name: string;
  duration: string;
  timing: string;
  iteration: string | number;
}

interface HintPattern {
  id: string;
  name: string;
  description: string;
  tiles: string[];
  sequence?: string[];
  context?: string;
  confidence: number;
}

interface UserHintPreferences {
  enabled: boolean;
  types: Set<string>;
  frequency: 'minimal' | 'normal' | 'frequent';
  autoSuggest: boolean;
  learningEnabled: boolean;
}

export class VisualHintsService {
  private static instance: VisualHintsService;
  private activeHints: Map<string, VisualHint> = new Map();
  private hintHistory: VisualHint[] = [];
  private patterns: Map<string, HintPattern> = new Map();
  private userPreferences: UserHintPreferences = {
    enabled: true,
    types: new Set(['highlight', 'glow', 'tooltip']),
    frequency: 'normal',
    autoSuggest: true,
    learningEnabled: true
  };
  private hintQueue: VisualHint[] = [];
  private isProcessing = false;
  private contextualData: Map<string, any> = new Map();

  private constructor() {
    this.initializePatterns();
    this.setupStyles();
  }

  static getInstance(): VisualHintsService {
    if (!VisualHintsService.instance) {
      VisualHintsService.instance = new VisualHintsService();
    }
    return VisualHintsService.instance;
  }

  initialize(): void {
    console.log('👁️ Visual Hints Service ready - AI-powered visual guidance');
    this.loadUserPreferences();
    this.startHintProcessor();
    this.setupEventListeners();
  }

  /**
   * Initialize common hint patterns
   */
  private initializePatterns(): void {
    const patterns: HintPattern[] = [
      {
        id: 'morning_routine',
        name: 'Morning Routine',
        description: 'Common morning activities',
        tiles: ['wake_up', 'breakfast', 'brush_teeth', 'get_dressed'],
        sequence: ['wake_up', 'bathroom', 'breakfast', 'brush_teeth'],
        context: 'morning',
        confidence: 0.85
      },
      {
        id: 'basic_needs',
        name: 'Basic Needs',
        description: 'Essential communication',
        tiles: ['yes', 'no', 'help', 'more', 'stop', 'please'],
        context: 'always',
        confidence: 0.95
      },
      {
        id: 'meal_time',
        name: 'Meal Time',
        description: 'Eating and drinking',
        tiles: ['hungry', 'thirsty', 'eat', 'drink', 'more', 'finished'],
        context: 'mealtime',
        confidence: 0.8
      },
      {
        id: 'emotional_expression',
        name: 'Emotional Expression',
        description: 'Feelings and emotions',
        tiles: ['happy', 'sad', 'angry', 'scared', 'tired', 'excited'],
        context: 'emotional',
        confidence: 0.75
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Show visual hint on a tile
   */
  showHint(
    tileId: string,
    type: VisualHint['type'] = 'highlight',
    options: Partial<VisualHint> = {}
  ): string {
    if (!this.userPreferences.enabled) return '';

    const hintId = `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const hint: VisualHint = {
      id: hintId,
      tileId,
      type,
      duration: options.duration || 3000,
      priority: options.priority || 'medium',
      trigger: options.trigger || { type: 'manual' },
      message: options.message,
      style: options.style,
      animation: options.animation
    };

    // Add to queue based on priority
    if (hint.priority === 'high') {
      this.hintQueue.unshift(hint);
    } else {
      this.hintQueue.push(hint);
    }

    this.processHintQueue();

    return hintId;
  }

  /**
   * Show contextual hints based on current context
   */
  showContextualHints(context: string, limit = 3): void {
    if (!this.userPreferences.enabled || !this.userPreferences.autoSuggest) return;

    const relevantPatterns = Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.context === context || 
        pattern.context === 'always'
      )
      .sort((a, b) => b.confidence - a.confidence);

    const smartDefaults = (window as any).moduleSystem?.get('SmartDefaultsService');
    const suggestions = smartDefaults?.getContextualSuggestions(context, limit) || [];

    // Combine pattern-based and smart suggestions
    const tilesToHint = new Set<string>();
    
    relevantPatterns.forEach(pattern => {
      pattern.tiles.slice(0, limit).forEach(tile => tilesToHint.add(tile));
    });

    suggestions.forEach((suggestion: any) => {
      if (suggestion.tileId) tilesToHint.add(suggestion.tileId);
    });

    // Show hints for suggested tiles
    Array.from(tilesToHint).slice(0, limit).forEach((tileId, index) => {
      setTimeout(() => {
        this.showHint(tileId, 'glow', {
          duration: 5000,
          priority: 'low',
          trigger: { type: 'context', condition: context },
          animation: {
            name: 'pulse',
            duration: '2s',
            timing: 'ease-in-out',
            iteration: 'infinite'
          }
        });
      }, index * 500);
    });
  }

  /**
   * Show sequence hints
   */
  showSequenceHints(completedTileId: string): void {
    if (!this.userPreferences.enabled) return;

    // Find patterns containing this tile
    const relevantPatterns = Array.from(this.patterns.values())
      .filter(pattern => pattern.sequence?.includes(completedTileId));

    relevantPatterns.forEach(pattern => {
      if (!pattern.sequence) return;
      
      const currentIndex = pattern.sequence.indexOf(completedTileId);
      if (currentIndex >= 0 && currentIndex < pattern.sequence.length - 1) {
        const nextTileId = pattern.sequence[currentIndex + 1];
        
        this.showHint(nextTileId, 'arrow', {
          duration: 4000,
          priority: 'medium',
          message: `Next: ${nextTileId}`,
          trigger: { type: 'sequence', condition: completedTileId }
        });
      }
    });
  }

  /**
   * Learn from user behavior
   */
  learnFromUsage(tileSequence: string[], context?: string): void {
    if (!this.userPreferences.learningEnabled || tileSequence.length < 2) return;

    const patternId = `learned_${Date.now()}`;
    const pattern: HintPattern = {
      id: patternId,
      name: `Learned Pattern ${this.patterns.size + 1}`,
      description: 'Pattern learned from user behavior',
      tiles: [...new Set(tileSequence)],
      sequence: tileSequence,
      context: context || 'general',
      confidence: 0.6 // Start with lower confidence
    };

    // Check if similar pattern exists
    const similarPattern = this.findSimilarPattern(pattern);
    if (similarPattern) {
      // Update confidence of existing pattern
      similarPattern.confidence = Math.min(0.95, similarPattern.confidence + 0.05);
    } else {
      // Add new pattern
      this.patterns.set(patternId, pattern);
    }

    this.savePatterns();
  }

  /**
   * Show idle hints
   */
  showIdleHints(idleTime: number): void {
    if (!this.userPreferences.enabled || idleTime < 30000) return; // 30 seconds

    const frequencyMultiplier = {
      minimal: 0.3,
      normal: 1,
      frequent: 2
    }[this.userPreferences.frequency];

    if (Math.random() > frequencyMultiplier * 0.5) return;

    // Show hints for commonly used tiles
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    const tileUsage = analyticsService?.getTileUsageStats() || {};
    
    const topTiles = Object.entries(tileUsage)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([tileId]) => tileId);

    topTiles.forEach((tileId, index) => {
      setTimeout(() => {
        this.showHint(tileId, 'pulse', {
          duration: 3000,
          priority: 'low',
          trigger: { type: 'idle', condition: idleTime }
        });
      }, index * 1000);
    });
  }

  /**
   * Clear hint
   */
  clearHint(hintId: string): void {
    const hint = this.activeHints.get(hintId);
    if (hint) {
      this.removeHintEffect(hint);
      this.activeHints.delete(hintId);
    }
  }

  /**
   * Clear all hints
   */
  clearAllHints(): void {
    this.activeHints.forEach(hint => {
      this.removeHintEffect(hint);
    });
    this.activeHints.clear();
    this.hintQueue = [];
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserHintPreferences>): void {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences
    };

    if (preferences.types) {
      this.userPreferences.types = new Set(preferences.types);
    }

    this.saveUserPreferences();

    if (!this.userPreferences.enabled) {
      this.clearAllHints();
    }
  }

  /**
   * Get hint statistics
   */
  getHintStatistics(): {
    totalShown: number;
    byType: Map<string, number>;
    byTrigger: Map<string, number>;
    effectiveHints: number;
  } {
    const byType = new Map<string, number>();
    const byTrigger = new Map<string, number>();

    this.hintHistory.forEach(hint => {
      byType.set(hint.type, (byType.get(hint.type) || 0) + 1);
      byTrigger.set(hint.trigger.type, (byTrigger.get(hint.trigger.type) || 0) + 1);
    });

    // Calculate effectiveness (hints that led to tile selection)
    const effectiveHints = this.hintHistory.filter(hint => {
      // This would check if the hint led to a tile selection
      return this.contextualData.get(`${hint.id}_effective`) === true;
    }).length;

    return {
      totalShown: this.hintHistory.length,
      byType,
      byTrigger,
      effectiveHints
    };
  }

  // Private helper methods
  private processHintQueue(): void {
    if (this.isProcessing || this.hintQueue.length === 0) return;

    this.isProcessing = true;

    const hint = this.hintQueue.shift();
    if (hint && this.userPreferences.types.has(hint.type)) {
      this.applyHintEffect(hint);
      this.activeHints.set(hint.id, hint);
      this.hintHistory.push(hint);

      // Auto-clear after duration
      if (hint.duration > 0) {
        setTimeout(() => {
          this.clearHint(hint.id);
        }, hint.duration);
      }
    }

    // Process next hint
    setTimeout(() => {
      this.isProcessing = false;
      this.processHintQueue();
    }, 200);
  }

  private applyHintEffect(hint: VisualHint): void {
    if (typeof document === 'undefined') return;

    const tileElement = document.querySelector(`[data-tile-id="${hint.tileId}"]`);
    if (!tileElement) return;

    const element = tileElement as HTMLElement;

    switch (hint.type) {
      case 'highlight':
        element.classList.add('hint-highlight');
        break;

      case 'glow':
        element.classList.add('hint-glow');
        break;

      case 'pulse':
        element.classList.add('hint-pulse');
        break;

      case 'arrow':
        this.createArrowHint(element, hint);
        break;

      case 'tooltip':
        this.createTooltipHint(element, hint);
        break;

      case 'border':
        element.classList.add('hint-border');
        break;
    }

    // Apply custom styles
    if (hint.style) {
      Object.assign(element.style, hint.style);
    }

    // Apply custom animation
    if (hint.animation) {
      element.style.animation = `${hint.animation.name} ${hint.animation.duration} ${hint.animation.timing} ${hint.animation.iteration}`;
    }
  }

  private removeHintEffect(hint: VisualHint): void {
    if (typeof document === 'undefined') return;

    const tileElement = document.querySelector(`[data-tile-id="${hint.tileId}"]`);
    if (!tileElement) return;

    const element = tileElement as HTMLElement;

    // Remove hint classes
    element.classList.remove('hint-highlight', 'hint-glow', 'hint-pulse', 'hint-border');

    // Remove custom styles
    if (hint.style) {
      Object.keys(hint.style).forEach(key => {
        element.style[key as any] = '';
      });
    }

    // Remove animation
    if (hint.animation) {
      element.style.animation = '';
    }

    // Remove arrow or tooltip
    const hintElement = document.getElementById(`hint-element-${hint.id}`);
    if (hintElement) {
      hintElement.remove();
    }
  }

  private createArrowHint(targetElement: HTMLElement, hint: VisualHint): void {
    const arrow = document.createElement('div');
    arrow.id = `hint-element-${hint.id}`;
    arrow.className = 'hint-arrow';
    arrow.innerHTML = '↓';
    
    const rect = targetElement.getBoundingClientRect();
    arrow.style.cssText = `
      position: absolute;
      top: ${rect.top - 30}px;
      left: ${rect.left + rect.width / 2 - 10}px;
      font-size: 24px;
      color: #FF9800;
      z-index: 10000;
      animation: bounce 1s ease-in-out infinite;
    `;

    document.body.appendChild(arrow);
  }

  private createTooltipHint(targetElement: HTMLElement, hint: VisualHint): void {
    if (!hint.message) return;

    const tooltip = document.createElement('div');
    tooltip.id = `hint-element-${hint.id}`;
    tooltip.className = 'hint-tooltip';
    tooltip.textContent = hint.message;
    
    const rect = targetElement.getBoundingClientRect();
    tooltip.style.cssText = `
      position: absolute;
      top: ${rect.bottom + 5}px;
      left: ${rect.left}px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      max-width: 200px;
    `;

    document.body.appendChild(tooltip);
  }

  private findSimilarPattern(pattern: HintPattern): HintPattern | null {
    for (const existing of this.patterns.values()) {
      if (existing.context !== pattern.context) continue;

      const tileOverlap = pattern.tiles.filter(tile => 
        existing.tiles.includes(tile)
      ).length;

      const similarity = tileOverlap / Math.max(pattern.tiles.length, existing.tiles.length);
      
      if (similarity > 0.7) {
        return existing;
      }
    }

    return null;
  }

  private setupStyles(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.innerHTML = `
      .hint-highlight {
        box-shadow: 0 0 15px #FFD700 !important;
        transform: scale(1.05);
        transition: all 0.3s ease;
      }

      .hint-glow {
        box-shadow: 0 0 20px #2196F3, 0 0 40px #2196F3 !important;
        transition: all 0.3s ease;
      }

      .hint-pulse {
        animation: hint-pulse-animation 2s ease-in-out infinite;
      }

      .hint-border {
        border: 3px solid #4CAF50 !important;
        transition: all 0.3s ease;
      }

      @keyframes hint-pulse-animation {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .hint-arrow, .hint-tooltip {
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for tile selections
    window.addEventListener('tileSelected', (event: any) => {
      const tileId = event.detail?.tileId;
      
      // Check if this tile had a hint
      const activeHint = Array.from(this.activeHints.values())
        .find(hint => hint.tileId === tileId);
      
      if (activeHint) {
        this.contextualData.set(`${activeHint.id}_effective`, true);
      }

      // Show sequence hints
      this.showSequenceHints(tileId);
    });

    // Listen for context changes
    window.addEventListener('contextChanged', (event: any) => {
      const context = event.detail?.context;
      if (context) {
        this.showContextualHints(context);
      }
    });

    // Listen for idle time
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.showIdleHints(30000);
      }, 30000);
    };

    ['mousedown', 'touchstart', 'keypress'].forEach(eventType => {
      document.addEventListener(eventType, resetIdleTimer);
    });
  }

  private startHintProcessor(): void {
    // Process hints at regular intervals
    setInterval(() => {
      if (!this.userPreferences.enabled) return;

      // Get current context
      const navigationService = (window as any).moduleSystem?.get('NavigationService');
      const currentContext = navigationService?.getCurrentContext() || 'general';

      // Show contextual hints periodically
      if (Math.random() < 0.1) { // 10% chance
        this.showContextualHints(currentContext, 2);
      }
    }, 30000); // Every 30 seconds
  }

  private loadUserPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('visual_hints_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.userPreferences = {
          ...this.userPreferences,
          ...prefs,
          types: new Set(prefs.types || [])
        };
      }
    } catch (error) {
      console.error('Failed to load hint preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const prefs = {
        ...this.userPreferences,
        types: Array.from(this.userPreferences.types)
      };
      localStorage.setItem('visual_hints_preferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save hint preferences:', error);
    }
  }

  private savePatterns(): void {
    if (typeof window === 'undefined') return;

    try {
      const patterns = Array.from(this.patterns.values());
      localStorage.setItem('visual_hints_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('Failed to save hint patterns:', error);
    }
  }
}

// Export singleton getter function
export function getVisualHintsService(): VisualHintsService {
  return VisualHintsService.getInstance();
}