/**
 * Navigation Service
 * Module 33: Advanced navigation assistance and wayfinding
 */

interface NavigationState {
  currentBoard: string;
  currentCategory: string;
  previousBoard?: string;
  breadcrumbs: string[];
  history: NavigationHistoryEntry[];
}

interface NavigationHistoryEntry {
  id: string;
  boardId: string;
  timestamp: string;
  action: 'navigate' | 'search' | 'quick_access';
  context?: string;
}

interface NavigationShortcut {
  id: string;
  label: string;
  targetBoard: string;
  icon: string;
  keyboardShortcut?: string;
  frequency: number;
  lastUsed: string;
}

interface NavigationTip {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'shortcut' | 'feature';
  category: string;
  shown: boolean;
  priority: number;
}

interface BoardMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  usage: number;
  lastAccessed: string;
}

export class NavigationService {
  private static instance: NavigationService;
  private navigationState: NavigationState;
  private shortcuts: Map<string, NavigationShortcut> = new Map();
  private tips: Map<string, NavigationTip> = new Map();
  private boardMetadata: Map<string, BoardMetadata> = new Map();
  private searchHistory: string[] = [];
  private isGuidedMode = false;
  private guidedSteps: string[] = [];
  private currentGuidedStep = 0;

  private constructor() {
    this.navigationState = {
      currentBoard: 'home',
      currentCategory: 'main',
      breadcrumbs: ['Home'],
      history: []
    };
    
    this.initializeDefaults();
  }

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  initialize(): void {
    console.log('🧭 Navigation Service ready - Advanced navigation assistance');
    this.loadNavigationData();
    this.setupNavigationTracking();
    this.initializeKeyboardShortcuts();
    this.loadBoardMetadata();
  }

  /**
   * Initialize default shortcuts and tips
   */
  private initializeDefaults(): void {
    // Default shortcuts
    const defaultShortcuts: NavigationShortcut[] = [
      {
        id: 'home',
        label: 'Home',
        targetBoard: 'home',
        icon: '🏠',
        keyboardShortcut: 'h',
        frequency: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'favorites',
        label: 'Favorites',
        targetBoard: 'favorites',
        icon: '⭐',
        keyboardShortcut: 'f',
        frequency: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'recent',
        label: 'Recent',
        targetBoard: 'recent',
        icon: '🕒',
        keyboardShortcut: 'r',
        frequency: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'settings',
        label: 'Settings',
        targetBoard: 'settings',
        icon: '⚙️',
        keyboardShortcut: 's',
        frequency: 0,
        lastUsed: new Date().toISOString()
      }
    ];

    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });

    // Default navigation tips
    const defaultTips: NavigationTip[] = [
      {
        id: 'breadcrumbs',
        title: 'Use Breadcrumbs',
        description: 'Click on breadcrumbs at the top to quickly navigate back to previous sections.',
        type: 'tip',
        category: 'navigation',
        shown: false,
        priority: 1
      },
      {
        id: 'back_button',
        title: 'Quick Back Navigation',
        description: 'Use the back button or swipe left to return to the previous board.',
        type: 'shortcut',
        category: 'navigation',
        shown: false,
        priority: 2
      },
      {
        id: 'search_feature',
        title: 'Smart Search',
        description: 'Use the search feature to quickly find tiles, boards, or categories.',
        type: 'feature',
        category: 'search',
        shown: false,
        priority: 1
      },
      {
        id: 'keyboard_shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'Press H for Home, F for Favorites, S for Settings, and R for Recent.',
        type: 'shortcut',
        category: 'accessibility',
        shown: false,
        priority: 3
      }
    ];

    defaultTips.forEach(tip => {
      this.tips.set(tip.id, tip);
    });
  }

  /**
   * Navigate to a specific board
   */
  async navigateTo(boardId: string, context?: string): Promise<boolean> {
    try {
      const previousBoard = this.navigationState.currentBoard;
      
      // Validate board exists
      if (!await this.validateBoard(boardId)) {
        console.warn(`Board ${boardId} not found`);
        return false;
      }

      // Update navigation state
      this.navigationState.previousBoard = previousBoard;
      this.navigationState.currentBoard = boardId;
      
      // Update breadcrumbs
      await this.updateBreadcrumbs(boardId);
      
      // Record navigation history
      this.recordNavigation(boardId, 'navigate', context);
      
      // Update board usage
      this.updateBoardUsage(boardId);
      
      // Update shortcuts frequency
      const shortcut = Array.from(this.shortcuts.values()).find(s => s.targetBoard === boardId);
      if (shortcut) {
        shortcut.frequency++;
        shortcut.lastUsed = new Date().toISOString();
      }

      // Notify app state
      const appStore = (window as any).useAppStore?.getState();
      if (appStore) {
        appStore.setCurrentBoard(boardId);
      }

      // Track analytics
      const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
      if (analyticsService) {
        analyticsService.trackEvent('navigation', {
          from: previousBoard,
          to: boardId,
          context: context || 'direct'
        });
      }

      // Show navigation tip if appropriate
      this.maybeShowNavigationTip();

      console.log(`🧭 Navigated from ${previousBoard} to ${boardId}`);
      return true;
      
    } catch (error) {
      console.error('Navigation failed:', error);
      return false;
    }
  }

  /**
   * Go back to previous board
   */
  goBack(): boolean {
    if (this.navigationState.previousBoard) {
      return this.navigateTo(this.navigationState.previousBoard, 'back_navigation');
    }
    
    // Fallback to last history entry
    const lastEntry = this.navigationState.history[this.navigationState.history.length - 2];
    if (lastEntry) {
      return this.navigateTo(lastEntry.boardId, 'history_back');
    }
    
    return false;
  }

  /**
   * Search for boards, categories, or content
   */
  async search(query: string): Promise<any[]> {
    const results: any[] = [];
    
    // Add to search history
    if (!this.searchHistory.includes(query)) {
      this.searchHistory.unshift(query);
      this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10 searches
    }

    // Search boards
    const boardResults = await this.searchBoards(query);
    results.push(...boardResults);

    // Search tiles
    const tileResults = await this.searchTiles(query);
    results.push(...tileResults);

    // Search shortcuts
    const shortcutResults = this.searchShortcuts(query);
    results.push(...shortcutResults);

    // Sort by relevance
    results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

    // Track search
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('search', {
        query,
        resultsCount: results.length,
        timestamp: new Date().toISOString()
      });
    }

    return results.slice(0, 20); // Return top 20 results
  }

  /**
   * Get navigation suggestions based on context
   */
  getNavigationSuggestions(limit = 5): NavigationShortcut[] {
    const suggestions: NavigationShortcut[] = [];
    
    // Get frequently used shortcuts
    const frequentShortcuts = Array.from(this.shortcuts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
    
    suggestions.push(...frequentShortcuts);

    // Get contextual suggestions
    const contextualSuggestions = this.getContextualSuggestions();
    suggestions.push(...contextualSuggestions);

    // Remove duplicates and return top suggestions
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    );

    return uniqueSuggestions.slice(0, limit);
  }

  /**
   * Create custom navigation shortcut
   */
  createShortcut(label: string, targetBoard: string, icon = '📌'): NavigationShortcut {
    const shortcut: NavigationShortcut = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      targetBoard,
      icon,
      frequency: 0,
      lastUsed: new Date().toISOString()
    };

    this.shortcuts.set(shortcut.id, shortcut);
    this.saveNavigationData();

    console.log(`📌 Created shortcut: ${label} → ${targetBoard}`);
    return shortcut;
  }

  /**
   * Delete navigation shortcut
   */
  deleteShortcut(shortcutId: string): boolean {
    const deleted = this.shortcuts.delete(shortcutId);
    if (deleted) {
      this.saveNavigationData();
      console.log(`🗑️ Deleted shortcut: ${shortcutId}`);
    }
    return deleted;
  }

  /**
   * Start guided navigation mode
   */
  startGuidedNavigation(steps: string[]): void {
    this.isGuidedMode = true;
    this.guidedSteps = steps;
    this.currentGuidedStep = 0;

    this.showGuidedNavigationOverlay();
    console.log('🎯 Started guided navigation mode');
  }

  /**
   * Stop guided navigation mode
   */
  stopGuidedNavigation(): void {
    this.isGuidedMode = false;
    this.guidedSteps = [];
    this.currentGuidedStep = 0;

    this.hideGuidedNavigationOverlay();
    console.log('🎯 Stopped guided navigation mode');
  }

  /**
   * Move to next step in guided mode
   */
  nextGuidedStep(): boolean {
    if (!this.isGuidedMode || this.currentGuidedStep >= this.guidedSteps.length - 1) {
      return false;
    }

    this.currentGuidedStep++;
    const nextBoard = this.guidedSteps[this.currentGuidedStep];
    this.navigateTo(nextBoard, 'guided_navigation');
    
    this.updateGuidedNavigationOverlay();
    return true;
  }

  /**
   * Move to previous step in guided mode
   */
  previousGuidedStep(): boolean {
    if (!this.isGuidedMode || this.currentGuidedStep <= 0) {
      return false;
    }

    this.currentGuidedStep--;
    const prevBoard = this.guidedSteps[this.currentGuidedStep];
    this.navigateTo(prevBoard, 'guided_navigation');
    
    this.updateGuidedNavigationOverlay();
    return true;
  }

  /**
   * Get current navigation state
   */
  getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(limit = 10): NavigationHistoryEntry[] {
    return this.navigationState.history
      .slice(-limit)
      .reverse();
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear navigation history
   */
  clearNavigationHistory(): void {
    this.navigationState.history = [];
    this.saveNavigationData();
    console.log('🗑️ Cleared navigation history');
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveNavigationData();
    console.log('🗑️ Cleared search history');
  }

  /**
   * Get all shortcuts
   */
  getAllShortcuts(): NavigationShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get navigation tips
   */
  getNavigationTips(category?: string): NavigationTip[] {
    const tips = Array.from(this.tips.values());
    return category ? tips.filter(tip => tip.category === category) : tips;
  }

  /**
   * Mark tip as shown
   */
  markTipAsShown(tipId: string): void {
    const tip = this.tips.get(tipId);
    if (tip) {
      tip.shown = true;
      this.saveNavigationData();
    }
  }

  // Private helper methods
  private async validateBoard(boardId: string): Promise<boolean> {
    // Check if board exists in app state or board manager
    const boardManager = (window as any).moduleSystem?.get('BoardManager');
    if (boardManager) {
      return await boardManager.boardExists(boardId);
    }
    
    // Fallback validation
    const validBoards = ['home', 'favorites', 'recent', 'settings', 'games', 'healthcare'];
    return validBoards.includes(boardId);
  }

  private async updateBreadcrumbs(boardId: string): Promise<void> {
    const boardMetadata = this.boardMetadata.get(boardId);
    const boardName = boardMetadata?.name || this.formatBoardName(boardId);
    
    // Simple breadcrumb logic - can be enhanced based on board hierarchy
    if (boardId === 'home') {
      this.navigationState.breadcrumbs = ['Home'];
    } else {
      this.navigationState.breadcrumbs = ['Home', boardName];
    }
  }

  private recordNavigation(boardId: string, action: NavigationHistoryEntry['action'], context?: string): void {
    const entry: NavigationHistoryEntry = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId,
      timestamp: new Date().toISOString(),
      action,
      context
    };

    this.navigationState.history.push(entry);
    
    // Keep only last 50 entries
    if (this.navigationState.history.length > 50) {
      this.navigationState.history = this.navigationState.history.slice(-50);
    }
  }

  private updateBoardUsage(boardId: string): void {
    const metadata = this.boardMetadata.get(boardId);
    if (metadata) {
      metadata.usage++;
      metadata.lastAccessed = new Date().toISOString();
    } else {
      // Create new metadata entry
      this.boardMetadata.set(boardId, {
        id: boardId,
        name: this.formatBoardName(boardId),
        category: 'general',
        description: '',
        tags: [],
        difficulty: 'beginner',
        usage: 1,
        lastAccessed: new Date().toISOString()
      });
    }
  }

  private async searchBoards(query: string): Promise<any[]> {
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    for (const [id, metadata] of this.boardMetadata) {
      let relevance = 0;
      
      if (metadata.name.toLowerCase().includes(queryLower)) {
        relevance += 10;
      }
      
      if (metadata.description.toLowerCase().includes(queryLower)) {
        relevance += 5;
      }
      
      if (metadata.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        relevance += 7;
      }

      if (relevance > 0) {
        results.push({
          id,
          type: 'board',
          title: metadata.name,
          description: metadata.description,
          relevance,
          metadata
        });
      }
    }

    return results;
  }

  private async searchTiles(query: string): Promise<any[]> {
    // Search through tiles - would integrate with tile management service
    const tileService = (window as any).moduleSystem?.get('TileManagementService');
    if (tileService) {
      return await tileService.searchTiles(query);
    }
    return [];
  }

  private searchShortcuts(query: string): any[] {
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.label.toLowerCase().includes(queryLower)) {
        results.push({
          id: shortcut.id,
          type: 'shortcut',
          title: shortcut.label,
          description: `Navigate to ${shortcut.targetBoard}`,
          relevance: 8,
          shortcut
        });
      }
    }

    return results;
  }

  private getContextualSuggestions(): NavigationShortcut[] {
    const suggestions: NavigationShortcut[] = [];
    const currentTime = new Date().getHours();
    
    // Time-based suggestions
    if (currentTime >= 9 && currentTime <= 17) {
      // Work hours - suggest professional tools
      const healthcareShortcut = Array.from(this.shortcuts.values())
        .find(s => s.targetBoard === 'healthcare');
      if (healthcareShortcut) {
        suggestions.push(healthcareShortcut);
      }
    }

    return suggestions;
  }

  private maybeShowNavigationTip(): void {
    // Show tips occasionally to help users learn navigation features
    const unshownTips = Array.from(this.tips.values())
      .filter(tip => !tip.shown)
      .sort((a, b) => a.priority - b.priority);

    if (unshownTips.length > 0 && Math.random() < 0.1) { // 10% chance
      const tip = unshownTips[0];
      this.showNavigationTip(tip);
    }
  }

  private showNavigationTip(tip: NavigationTip): void {
    if (typeof document === 'undefined') return;

    const tipElement = document.createElement('div');
    tipElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 9999;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    tipElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${tip.title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${tip.description}</div>
      <button onclick="this.parentElement.remove()" 
              style="position: absolute; top: 5px; right: 8px; background: none; 
                     border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
    `;

    document.body.appendChild(tipElement);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      tipElement.remove();
    }, 8000);

    // Mark as shown
    this.markTipAsShown(tip.id);
  }

  private showGuidedNavigationOverlay(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'guided-navigation-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    this.updateGuidedNavigationOverlay();
    document.body.appendChild(overlay);
  }

  private updateGuidedNavigationOverlay(): void {
    const overlay = document.getElementById('guided-navigation-overlay');
    if (!overlay) return;

    const progress = ((this.currentGuidedStep + 1) / this.guidedSteps.length) * 100;
    overlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <div>🎯 Guided Tour</div>
        <div style="background: rgba(255,255,255,0.2); height: 4px; width: 100px; border-radius: 2px;">
          <div style="background: white; height: 4px; border-radius: 2px; width: ${progress}%;"></div>
        </div>
        <div>${this.currentGuidedStep + 1}/${this.guidedSteps.length}</div>
        <button onclick="window.navigationService.stopGuidedNavigation()" 
                style="background: none; border: none; color: white; cursor: pointer;">✖</button>
      </div>
    `;

    // Expose service to window
    (window as any).navigationService = this;
  }

  private hideGuidedNavigationOverlay(): void {
    const overlay = document.getElementById('guided-navigation-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  private setupNavigationTracking(): void {
    if (typeof window === 'undefined') return;

    // Track board changes
    window.addEventListener('boardChange', (event: any) => {
      const { boardId } = event.detail;
      this.recordNavigation(boardId, 'navigate', 'board_change_event');
    });

    // Track back button usage
    window.addEventListener('popstate', () => {
      this.goBack();
    });
  }

  private initializeKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for navigation shortcuts
      for (const shortcut of this.shortcuts.values()) {
        if (shortcut.keyboardShortcut && event.key.toLowerCase() === shortcut.keyboardShortcut) {
          event.preventDefault();
          this.navigateTo(shortcut.targetBoard, 'keyboard_shortcut');
          break;
        }
      }

      // Back navigation with Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        this.goBack();
      }
    });
  }

  private loadBoardMetadata(): void {
    // Initialize with default board metadata
    const defaultBoards: BoardMetadata[] = [
      {
        id: 'home',
        name: 'Home',
        category: 'main',
        description: 'Main dashboard with quick access to all features',
        tags: ['main', 'dashboard'],
        difficulty: 'beginner',
        usage: 0,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'favorites',
        name: 'Favorites',
        category: 'personal',
        description: 'Your favorite tiles and frequently used items',
        tags: ['favorites', 'personal', 'quick'],
        difficulty: 'beginner',
        usage: 0,
        lastAccessed: new Date().toISOString()
      }
    ];

    defaultBoards.forEach(board => {
      this.boardMetadata.set(board.id, board);
    });
  }

  private formatBoardName(boardId: string): string {
    return boardId.charAt(0).toUpperCase() + boardId.slice(1).replace(/[_-]/g, ' ');
  }

  private loadNavigationData(): void {
    if (typeof window === 'undefined') return;

    try {
      const navigationData = localStorage.getItem('navigation_data');
      if (navigationData) {
        const data = JSON.parse(navigationData);
        
        if (data.shortcuts) {
          data.shortcuts.forEach((shortcut: NavigationShortcut) => {
            this.shortcuts.set(shortcut.id, shortcut);
          });
        }
        
        if (data.searchHistory) {
          this.searchHistory = data.searchHistory;
        }
        
        if (data.tips) {
          data.tips.forEach((tip: NavigationTip) => {
            this.tips.set(tip.id, tip);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load navigation data:', error);
    }
  }

  private saveNavigationData(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        shortcuts: Array.from(this.shortcuts.values()),
        searchHistory: this.searchHistory,
        tips: Array.from(this.tips.values()),
        navigationState: this.navigationState
      };
      
      localStorage.setItem('navigation_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save navigation data:', error);
    }
  }
}

// Export singleton getter function
export function getNavigationService(): NavigationService {
  return NavigationService.getInstance();
}