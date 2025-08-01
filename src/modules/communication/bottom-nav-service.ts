/**
 * Bottom Navigation Service
 * Module 34: Quick access bottom navigation with customizable buttons
 */

interface BottomNavButton {
  id: string;
  label: string;
  icon: string;
  action: 'speak' | 'navigate' | 'toggle' | 'custom';
  value: string;
  color: string;
  position: number;
  visible: boolean;
  usage: number;
  lastUsed: string;
  customizable: boolean;
}

interface BottomNavTheme {
  id: string;
  name: string;
  backgroundColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  buttonSpacing: 'tight' | 'normal' | 'loose';
  textSize: 'small' | 'medium' | 'large';
  showLabels: boolean;
}

interface BottomNavConfiguration {
  theme: string;
  position: 'bottom' | 'top' | 'left' | 'right';
  autohide: boolean;
  autohideDelay: number;
  maxButtons: number;
  allowReordering: boolean;
  hapticFeedback: boolean;
}

interface QuickPhrase {
  id: string;
  text: string;
  category: string;
  icon: string;
  frequency: number;
  lastUsed: string;
  emergency: boolean;
}

export class BottomNavService {
  private static instance: BottomNavService;
  private buttons: Map<string, BottomNavButton> = new Map();
  private themes: Map<string, BottomNavTheme> = new Map();
  private quickPhrases: Map<string, QuickPhrase> = new Map();
  private configuration: BottomNavConfiguration;
  private isVisible = true;
  private autohideTimer: NodeJS.Timeout | null = null;
  private element: HTMLElement | null = null;

  private constructor() {
    this.configuration = {
      theme: 'default',
      position: 'bottom',
      autohide: false,
      autohideDelay: 3000,
      maxButtons: 6,
      allowReordering: true,
      hapticFeedback: true
    };
    
    this.initializeDefaults();
  }

  static getInstance(): BottomNavService {
    if (!BottomNavService.instance) {
      BottomNavService.instance = new BottomNavService();
    }
    return BottomNavService.instance;
  }

  initialize(): void {
    console.log('🔄 Bottom Nav Service ready - Quick access navigation');
    this.loadConfiguration();
    this.createBottomNavElement();
    this.setupEventListeners();
    this.startUsageTracking();
  }

  /**
   * Initialize default buttons and themes
   */
  private initializeDefaults(): void {
    // Default buttons based on the original HTML
    const defaultButtons: BottomNavButton[] = [
      {
        id: 'yes',
        label: 'Yes',
        icon: '✅',
        action: 'speak',
        value: 'Yes',
        color: '#4CAF50',
        position: 0,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: false
      },
      {
        id: 'no',
        label: 'No',
        icon: '❌',
        action: 'speak',
        value: 'No',
        color: '#f44336',
        position: 1,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: false
      },
      {
        id: 'help',
        label: 'Help',
        icon: '🆘',
        action: 'speak',
        value: 'Help me please',
        color: '#FF9800',
        position: 2,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: false
      },
      {
        id: 'bathroom',
        label: 'Bathroom',
        icon: '🚽',
        action: 'speak',
        value: 'I need the bathroom',
        color: '#2196F3',
        position: 3,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: false
      },
      {
        id: 'water',
        label: 'Water',
        icon: '💧',
        action: 'speak',
        value: 'I want water',
        color: '#00BCD4',
        position: 4,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: true
      },
      {
        id: 'more',
        label: 'More',
        icon: '⋯',
        action: 'toggle',
        value: 'expand_menu',
        color: '#9E9E9E',
        position: 5,
        visible: true,
        usage: 0,
        lastUsed: new Date().toISOString(),
        customizable: false
      }
    ];

    defaultButtons.forEach(button => {
      this.buttons.set(button.id, button);
    });

    // Default themes
    const defaultThemes: BottomNavTheme[] = [
      {
        id: 'default',
        name: 'Default',
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        buttonStyle: 'rounded',
        buttonSpacing: 'normal',
        textSize: 'medium',
        showLabels: true
      },
      {
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        buttonStyle: 'pill',
        buttonSpacing: 'tight',
        textSize: 'small',
        showLabels: false
      },
      {
        id: 'accessible',
        name: 'High Contrast',
        backgroundColor: '#000000',
        buttonStyle: 'square',
        buttonSpacing: 'loose',
        textSize: 'large',
        showLabels: true
      }
    ];

    defaultThemes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });

    // Default quick phrases
    const defaultPhrases: QuickPhrase[] = [
      {
        id: 'hungry',
        text: 'I am hungry',
        category: 'needs',
        icon: '🍽️',
        frequency: 0,
        lastUsed: new Date().toISOString(),
        emergency: false
      },
      {
        id: 'tired',
        text: 'I am tired',
        category: 'feelings',
        icon: '😴',
        frequency: 0,
        lastUsed: new Date().toISOString(),
        emergency: false
      },
      {
        id: 'pain',
        text: 'I am in pain',
        category: 'medical',
        icon: '🤕',
        frequency: 0,
        lastUsed: new Date().toISOString(),
        emergency: true
      },
      {
        id: 'thank_you',
        text: 'Thank you',
        category: 'social',
        icon: '🙏',
        frequency: 0,
        lastUsed: new Date().toISOString(),
        emergency: false
      }
    ];

    defaultPhrases.forEach(phrase => {
      this.quickPhrases.set(phrase.id, phrase);
    });
  }

  /**
   * Create bottom navigation DOM element
   */
  private createBottomNavElement(): void {
    if (typeof document === 'undefined') return;

    this.element = document.createElement('div');
    this.element.id = 'bottom-navigation';
    this.element.className = 'bottom-nav';
    
    this.updateBottomNavStyles();
    this.renderButtons();
    
    document.body.appendChild(this.element);
  }

  /**
   * Update bottom navigation styles based on theme and configuration
   */
  private updateBottomNavStyles(): void {
    if (!this.element) return;

    const theme = this.themes.get(this.configuration.theme) || this.themes.get('default')!;
    const position = this.configuration.position;

    const baseStyles = `
      position: fixed;
      ${position}: 0;
      ${position === 'bottom' || position === 'top' ? 'left: 0; right: 0;' : 'top: 0; bottom: 0;'}
      background: ${theme.backgroundColor};
      display: flex;
      ${position === 'left' || position === 'right' ? 'flex-direction: column;' : ''}
      padding: ${theme.buttonSpacing === 'loose' ? '15px' : theme.buttonSpacing === 'tight' ? '5px' : '10px'};
      gap: ${theme.buttonSpacing === 'loose' ? '15px' : theme.buttonSpacing === 'tight' ? '5px' : '10px'};
      backdrop-filter: blur(10px);
      z-index: 1000;
      ${position === 'bottom' || position === 'top' ? 'height: 80px;' : 'width: 80px;'}
      transition: all 0.3s ease;
      ${!this.isVisible ? 'transform: translate' + (position === 'bottom' ? 'Y(100%)' : position === 'top' ? 'Y(-100%)' : position === 'left' ? 'X(-100%)' : 'X(100%)') + ';' : ''}
    `;

    this.element.style.cssText = baseStyles;
  }

  /**
   * Render navigation buttons
   */
  private renderButtons(): void {
    if (!this.element) return;

    const theme = this.themes.get(this.configuration.theme) || this.themes.get('default')!;
    const visibleButtons = Array.from(this.buttons.values())
      .filter(button => button.visible)
      .sort((a, b) => a.position - b.position)
      .slice(0, this.configuration.maxButtons);

    this.element.innerHTML = '';

    visibleButtons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.className = 'nav-btn';
      buttonElement.dataset.buttonId = button.id;
      
      const buttonStyles = `
        background: ${button.color};
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-height: 50px;
        font-size: ${theme.textSize === 'large' ? '16px' : theme.textSize === 'small' ? '12px' : '14px'};
        font-weight: bold;
        transition: all 0.2s ease;
        ${this.getButtonShapeStyles(theme.buttonStyle)}
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      `;

      buttonElement.style.cssText = buttonStyles;

      buttonElement.innerHTML = `
        <span style="font-size: 24px; margin-bottom: 4px;">${button.icon}</span>
        ${theme.showLabels ? `<span style="font-size: 12px;">${button.label}</span>` : ''}
      `;

      // Add event listeners
      buttonElement.addEventListener('click', () => this.handleButtonClick(button));
      
      // Add hover effects
      buttonElement.addEventListener('mouseenter', () => {
        buttonElement.style.transform = 'scale(1.05)';
        buttonElement.style.opacity = '0.9';
      });
      
      buttonElement.addEventListener('mouseleave', () => {
        buttonElement.style.transform = 'scale(1)';
        buttonElement.style.opacity = '1';
      });

      // Add touch feedback
      buttonElement.addEventListener('touchstart', () => {
        buttonElement.style.transform = 'scale(0.95)';
        if (this.configuration.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(50);
        }
      });

      buttonElement.addEventListener('touchend', () => {
        buttonElement.style.transform = 'scale(1)';
      });

      this.element.appendChild(buttonElement);
    });
  }

  /**
   * Get button shape styles based on theme
   */
  private getButtonShapeStyles(style: BottomNavTheme['buttonStyle']): string {
    switch (style) {
      case 'rounded':
        return 'border-radius: 12px;';
      case 'pill':
        return 'border-radius: 25px;';
      case 'square':
        return 'border-radius: 4px;';
      default:
        return 'border-radius: 8px;';
    }
  }

  /**
   * Handle button click
   */
  private handleButtonClick(button: BottomNavButton): void {
    // Update usage statistics
    button.usage++;
    button.lastUsed = new Date().toISOString();

    // Perform action based on button type
    switch (button.action) {
      case 'speak':
        this.speakText(button.value);
        break;
      case 'navigate':
        this.navigateToBoard(button.value);
        break;
      case 'toggle':
        this.handleToggleAction(button.value);
        break;
      case 'custom':
        this.handleCustomAction(button.id, button.value);
        break;
    }

    // Track analytics
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('bottom_nav_click', {
        buttonId: button.id,
        action: button.action,
        value: button.value
      });
    }

    // Show usage feedback
    this.showButtonFeedback(button);

    console.log(`🔄 Bottom nav button clicked: ${button.label}`);
  }

  /**
   * Speak text using speech service
   */
  private speakText(text: string): void {
    const speechService = (window as any).moduleSystem?.get('SpeechService');
    if (speechService) {
      speechService.speak(text);
    }

    // Also add to sentence bar if available
    const appStore = (window as any).useAppStore?.getState();
    if (appStore && appStore.addToSentence) {
      appStore.addToSentence({ text, id: `quick_${Date.now()}` });
    }
  }

  /**
   * Navigate to board
   */
  private navigateToBoard(boardId: string): void {
    const navigationService = (window as any).moduleSystem?.get('NavigationService');
    if (navigationService) {
      navigationService.navigateTo(boardId, 'bottom_nav');
    }
  }

  /**
   * Handle toggle actions
   */
  private handleToggleAction(action: string): void {
    switch (action) {
      case 'expand_menu':
        this.showExpandedMenu();
        break;
      case 'hide_nav':
        this.hide();
        break;
      case 'settings':
        this.showSettings();
        break;
    }
  }

  /**
   * Handle custom actions
   */
  private handleCustomAction(buttonId: string, value: string): void {
    // Emit custom event for app to handle
    window.dispatchEvent(new CustomEvent('bottomNavCustomAction', {
      detail: { buttonId, value }
    }));
  }

  /**
   * Show expanded menu with more options
   */
  private showExpandedMenu(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'expanded-menu-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    `;

    const menu = document.createElement('div');
    menu.style.cssText = `
      background: #1a1a1a;
      border-radius: 15px;
      padding: 20px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
    `;

    // Add quick phrases
    const phrasesGrid = document.createElement('div');
    phrasesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    `;

    const sortedPhrases = Array.from(this.quickPhrases.values())
      .sort((a, b) => b.frequency - a.frequency);

    sortedPhrases.forEach(phrase => {
      const phraseButton = document.createElement('button');
      phraseButton.style.cssText = `
        background: ${phrase.emergency ? '#f44336' : '#4CAF50'};
        border: none;
        color: white;
        padding: 15px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      `;

      phraseButton.innerHTML = `
        <span style="font-size: 24px;">${phrase.icon}</span>
        <span style="font-size: 14px; font-weight: bold;">${phrase.text}</span>
      `;

      phraseButton.addEventListener('click', () => {
        this.speakText(phrase.text);
        phrase.frequency++;
        phrase.lastUsed = new Date().toISOString();
        overlay.remove();
      });

      phrasesGrid.appendChild(phraseButton);
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: #666;
      border: none;
      color: white;
      padding: 15px 30px;
      border-radius: 10px;
      cursor: pointer;
      width: 100%;
      font-size: 16px;
      margin-top: 10px;
    `;
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => overlay.remove());

    menu.appendChild(phrasesGrid);
    menu.appendChild(closeButton);
    overlay.appendChild(menu);
    document.body.appendChild(overlay);
  }

  /**
   * Show button feedback animation
   */
  private showButtonFeedback(button: BottomNavButton): void {
    const buttonElement = document.querySelector(`[data-button-id="${button.id}"]`) as HTMLElement;
    if (!buttonElement) return;

    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    const rect = buttonElement.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width - size) / 2 + 'px';
    ripple.style.top = (rect.height - size) / 2 + 'px';

    buttonElement.style.position = 'relative';
    buttonElement.style.overflow = 'hidden';
    buttonElement.appendChild(ripple);

    // Add ripple animation if not exists
    if (!document.getElementById('ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Add custom button
   */
  addButton(buttonConfig: Omit<BottomNavButton, 'id' | 'usage' | 'lastUsed'>): string {
    const buttonId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const button: BottomNavButton = {
      id: buttonId,
      usage: 0,
      lastUsed: new Date().toISOString(),
      ...buttonConfig
    };

    this.buttons.set(buttonId, button);
    this.saveConfiguration();
    this.renderButtons();

    console.log(`➕ Added custom button: ${button.label}`);
    return buttonId;
  }

  /**
   * Remove button
   */
  removeButton(buttonId: string): boolean {
    const button = this.buttons.get(buttonId);
    if (!button || !button.customizable) {
      return false;
    }

    this.buttons.delete(buttonId);
    this.saveConfiguration();
    this.renderButtons();

    console.log(`🗑️ Removed button: ${buttonId}`);
    return true;
  }

  /**
   * Update button configuration
   */
  updateButton(buttonId: string, updates: Partial<BottomNavButton>): boolean {
    const button = this.buttons.get(buttonId);
    if (!button) return false;

    Object.assign(button, updates);
    this.saveConfiguration();
    this.renderButtons();

    return true;
  }

  /**
   * Reorder buttons
   */
  reorderButtons(buttonIds: string[]): void {
    if (!this.configuration.allowReordering) return;

    buttonIds.forEach((buttonId, index) => {
      const button = this.buttons.get(buttonId);
      if (button) {
        button.position = index;
      }
    });

    this.saveConfiguration();
    this.renderButtons();
  }

  /**
   * Show/hide bottom navigation
   */
  show(): void {
    this.isVisible = true;
    this.updateBottomNavStyles();
    
    if (this.autohideTimer) {
      clearTimeout(this.autohideTimer);
      this.autohideTimer = null;
    }
  }

  hide(): void {
    this.isVisible = false;
    this.updateBottomNavStyles();
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set configuration
   */
  setConfiguration(config: Partial<BottomNavConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.saveConfiguration();
    this.updateBottomNavStyles();
    this.renderButtons();

    console.log('⚙️ Updated bottom nav configuration');
  }

  /**
   * Get configuration
   */
  getConfiguration(): BottomNavConfiguration {
    return { ...this.configuration };
  }

  /**
   * Get all buttons
   */
  getAllButtons(): BottomNavButton[] {
    return Array.from(this.buttons.values());
  }

  /**
   * Get visible buttons
   */
  getVisibleButtons(): BottomNavButton[] {
    return Array.from(this.buttons.values())
      .filter(button => button.visible)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get button usage statistics
   */
  getUsageStatistics(): { buttonId: string; label: string; usage: number; lastUsed: string }[] {
    return Array.from(this.buttons.values())
      .map(button => ({
        buttonId: button.id,
        label: button.label,
        usage: button.usage,
        lastUsed: button.lastUsed
      }))
      .sort((a, b) => b.usage - a.usage);
  }

  /**
   * Add quick phrase
   */
  addQuickPhrase(phrase: Omit<QuickPhrase, 'id' | 'frequency' | 'lastUsed'>): string {
    const phraseId = `phrase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const quickPhrase: QuickPhrase = {
      id: phraseId,
      frequency: 0,
      lastUsed: new Date().toISOString(),
      ...phrase
    };

    this.quickPhrases.set(phraseId, quickPhrase);
    this.saveConfiguration();

    return phraseId;
  }

  /**
   * Get all quick phrases
   */
  getAllQuickPhrases(): QuickPhrase[] {
    return Array.from(this.quickPhrases.values());
  }

  // Private helper methods
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Auto-hide functionality
    if (this.configuration.autohide) {
      let lastActivity = Date.now();

      const resetTimer = () => {
        lastActivity = Date.now();
        this.show();
        
        if (this.autohideTimer) {
          clearTimeout(this.autohideTimer);
        }
        
        this.autohideTimer = setTimeout(() => {
          if (Date.now() - lastActivity >= this.configuration.autohideDelay) {
            this.hide();
          }
        }, this.configuration.autohideDelay);
      };

      document.addEventListener('mousemove', resetTimer);
      document.addEventListener('touchstart', resetTimer);
      document.addEventListener('click', resetTimer);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number keys 1-6 for quick button access
      const keyNumber = parseInt(event.key);
      if (keyNumber >= 1 && keyNumber <= 6) {
        const buttons = this.getVisibleButtons();
        const button = buttons[keyNumber - 1];
        if (button) {
          event.preventDefault();
          this.handleButtonClick(button);
        }
      }
    });
  }

  private startUsageTracking(): void {
    // Save usage statistics periodically
    setInterval(() => {
      this.saveConfiguration();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private showSettings(): void {
    // Dispatch event to show bottom nav settings
    window.dispatchEvent(new CustomEvent('showBottomNavSettings'));
  }

  private loadConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      const configData = localStorage.getItem('bottom_nav_config');
      if (configData) {
        const data = JSON.parse(configData);
        
        if (data.configuration) {
          this.configuration = { ...this.configuration, ...data.configuration };
        }
        
        if (data.buttons) {
          this.buttons.clear();
          data.buttons.forEach((button: BottomNavButton) => {
            this.buttons.set(button.id, button);
          });
        }
        
        if (data.quickPhrases) {
          this.quickPhrases.clear();
          data.quickPhrases.forEach((phrase: QuickPhrase) => {
            this.quickPhrases.set(phrase.id, phrase);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load bottom nav configuration:', error);
    }
  }

  private saveConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        configuration: this.configuration,
        buttons: Array.from(this.buttons.values()),
        quickPhrases: Array.from(this.quickPhrases.values())
      };
      
      localStorage.setItem('bottom_nav_config', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save bottom nav configuration:', error);
    }
  }
}

// Export singleton getter function
export function getBottomNavService(): BottomNavService {
  return BottomNavService.getInstance();
}