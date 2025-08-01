// Module 15: Accessibility Service
// Handles accessibility features (high contrast, large text, screen reader support)

import { getUIEffectsService } from '../ui/ui-effects-service';
import { getHapticService } from '../ui/haptic-service';
import { getSpeechService } from '../core/speech-service';
import { getAnalyticsService } from '../core/analytics-service';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  extraLargeText: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  textSpacing: 'normal' | 'increased' | 'maximum';
  cursorSize: 'normal' | 'large' | 'extra-large';
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  description: string;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private uiEffects: ReturnType<typeof getUIEffectsService> | null = null;
  private haptic: ReturnType<typeof getHapticService> | null = null;
  private speech: ReturnType<typeof getSpeechService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  
  private settings: AccessibilitySettings = {
    highContrast: false,
    largeText: false,
    extraLargeText: false,
    reduceMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindMode: 'none',
    textSpacing: 'normal',
    cursorSize: 'normal'
  };
  
  private shortcuts: KeyboardShortcut[] = [
    { key: 'Tab', modifiers: [], action: 'navigate_forward', description: 'Navigate to next tile' },
    { key: 'Tab', modifiers: ['Shift'], action: 'navigate_backward', description: 'Navigate to previous tile' },
    { key: 'Enter', modifiers: [], action: 'select_tile', description: 'Select current tile' },
    { key: 'Space', modifiers: [], action: 'speak_tile', description: 'Speak current tile' },
    { key: 'Escape', modifiers: [], action: 'clear_sentence', description: 'Clear sentence bar' },
    { key: 's', modifiers: ['Ctrl'], action: 'toggle_settings', description: 'Toggle settings panel' },
    { key: 'h', modifiers: ['Ctrl'], action: 'toggle_high_contrast', description: 'Toggle high contrast' },
    { key: '+', modifiers: ['Ctrl'], action: 'increase_text_size', description: 'Increase text size' },
    { key: '-', modifiers: ['Ctrl'], action: 'decrease_text_size', description: 'Decrease text size' },
    { key: '/', modifiers: ['Ctrl'], action: 'show_shortcuts', description: 'Show keyboard shortcuts' }
  ];
  
  private focusedElement: HTMLElement | null = null;
  private focusTrap: HTMLElement | null = null;

  private constructor() {
    console.log('AccessibilityService created');
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  async initialize(): Promise<void> {
    this.uiEffects = getUIEffectsService();
    this.haptic = getHapticService();
    this.speech = getSpeechService();
    this.analytics = getAnalyticsService();
    
    // Load saved settings
    this.loadSettings();
    
    // Apply initial settings
    this.applyAllSettings();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Setup screen reader support
    this.setupScreenReaderSupport();
    
    // Monitor system preferences
    this.monitorSystemPreferences();
    
    console.log('AccessibilityService initialized');
  }

  // Get current settings
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(settings: Partial<AccessibilitySettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...settings };
    
    // Apply changed settings
    Object.keys(settings).forEach(key => {
      const settingKey = key as keyof AccessibilitySettings;
      if (oldSettings[settingKey] !== this.settings[settingKey]) {
        this.applySetting(settingKey, this.settings[settingKey]);
      }
    });
    
    // Save settings
    this.saveSettings();
    
    // Track changes
    this.analytics?.track('accessibility_settings_changed', settings);
  }

  // Toggle high contrast
  toggleHighContrast(): void {
    this.updateSettings({ highContrast: !this.settings.highContrast });
  }

  // Cycle text size
  cycleTextSize(): void {
    if (!this.settings.largeText) {
      this.updateSettings({ largeText: true });
    } else if (!this.settings.extraLargeText) {
      this.updateSettings({ extraLargeText: true });
    } else {
      this.updateSettings({ largeText: false, extraLargeText: false });
    }
  }

  // Get keyboard shortcuts
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  // Add custom shortcut
  addCustomShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
    this.saveCustomShortcuts();
  }

  // Remove custom shortcut
  removeCustomShortcut(action: string): void {
    this.shortcuts = this.shortcuts.filter(s => s.action !== action);
    this.saveCustomShortcuts();
  }

  // Announce to screen reader
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Focus management
  setFocusTrap(element: HTMLElement): void {
    this.focusTrap = element;
    this.trapFocus();
  }

  clearFocusTrap(): void {
    this.focusTrap = null;
  }

  // Navigate tiles with keyboard
  navigateToTile(direction: 'next' | 'previous' | 'up' | 'down'): void {
    const tiles = this.getFocusableTiles();
    if (tiles.length === 0) return;
    
    const currentIndex = Array.from(tiles).findIndex((tile: Element) => tile === document.activeElement);
    let nextIndex = currentIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % tiles.length;
    } else if (direction === 'previous') {
      nextIndex = currentIndex === -1 ? tiles.length - 1 : (currentIndex - 1 + tiles.length) % tiles.length;
    } else if (direction === 'up' || direction === 'down') {
      // Calculate grid navigation
      const columns = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-columns') || '3');
      const offset = direction === 'up' ? -columns : columns;
      nextIndex = Math.max(0, Math.min(tiles.length - 1, currentIndex + offset));
    }
    
    if (tiles[nextIndex]) {
      (tiles[nextIndex] as HTMLElement).focus();
      this.announce(`Tile ${nextIndex + 1} of ${tiles.length}: ${tiles[nextIndex].textContent}`);
    }
  }

  // Private methods
  private loadSettings(): void {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
    
    // Check system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reduceMotion = true;
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true;
    }
  }

  private saveSettings(): void {
    localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
  }

  private applyAllSettings(): void {
    Object.keys(this.settings).forEach(key => {
      const settingKey = key as keyof AccessibilitySettings;
      this.applySetting(settingKey, this.settings[settingKey]);
    });
  }

  private applySetting(key: keyof AccessibilitySettings, value: any): void {
    const root = document.documentElement;
    
    switch (key) {
      case 'highContrast':
        root.classList.toggle('high-contrast', value);
        if (value) {
          root.style.setProperty('--tile-shadow', '0 0 0 2px white');
          root.style.setProperty('--tile-hover-shadow', '0 0 0 4px white');
        } else {
          root.style.removeProperty('--tile-shadow');
          root.style.removeProperty('--tile-hover-shadow');
        }
        break;
        
      case 'largeText':
        root.classList.toggle('large-text', value);
        root.style.setProperty('--font-scale', value ? '1.2' : '1');
        break;
        
      case 'extraLargeText':
        root.classList.toggle('extra-large-text', value);
        root.style.setProperty('--font-scale', value ? '1.5' : (this.settings.largeText ? '1.2' : '1'));
        break;
        
      case 'reduceMotion':
        root.classList.toggle('reduce-motion', value);
        if (value) {
          // Disable all animations
          root.style.setProperty('--transition-speed', '0s');
          this.uiEffects?.disableAllEffects();
        } else {
          root.style.setProperty('--transition-speed', '0.3s');
          this.uiEffects?.enableAllEffects();
        }
        break;
        
      case 'screenReaderOptimized':
        root.classList.toggle('screen-reader-optimized', value);
        break;
        
      case 'focusIndicators':
        root.classList.toggle('enhanced-focus', value);
        break;
        
      case 'colorBlindMode':
        root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
        if (value !== 'none') {
          root.classList.add(value);
        }
        break;
        
      case 'textSpacing':
        switch (value) {
          case 'increased':
            root.style.setProperty('--text-spacing', '0.1em');
            root.style.setProperty('--line-height', '1.8');
            break;
          case 'maximum':
            root.style.setProperty('--text-spacing', '0.2em');
            root.style.setProperty('--line-height', '2');
            break;
          default:
            root.style.removeProperty('--text-spacing');
            root.style.removeProperty('--line-height');
        }
        break;
        
      case 'cursorSize':
        root.classList.remove('large-cursor', 'extra-large-cursor');
        if (value === 'large') root.classList.add('large-cursor');
        if (value === 'extra-large') root.classList.add('extra-large-cursor');
        break;
    }
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.settings.keyboardNavigation) return;
    
    const shortcut = this.findMatchingShortcut(event);
    if (!shortcut) return;
    
    event.preventDefault();
    this.executeShortcutAction(shortcut.action);
  }

  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
    return this.shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const modifiersMatch = 
        shortcut.modifiers.includes('Ctrl') === event.ctrlKey &&
        shortcut.modifiers.includes('Shift') === event.shiftKey &&
        shortcut.modifiers.includes('Alt') === event.altKey &&
        shortcut.modifiers.includes('Meta') === event.metaKey;
      
      return keyMatch && modifiersMatch;
    });
  }

  private executeShortcutAction(action: string): void {
    switch (action) {
      case 'navigate_forward':
        this.navigateToTile('next');
        break;
      case 'navigate_backward':
        this.navigateToTile('previous');
        break;
      case 'select_tile':
        (document.activeElement as HTMLElement)?.click();
        break;
      case 'speak_tile':
        const text = document.activeElement?.textContent;
        if (text) this.speech?.speak(text);
        break;
      case 'clear_sentence':
        window.dispatchEvent(new Event('clearSentence'));
        break;
      case 'toggle_settings':
        window.dispatchEvent(new Event('toggleSettings'));
        break;
      case 'toggle_high_contrast':
        this.toggleHighContrast();
        break;
      case 'increase_text_size':
      case 'decrease_text_size':
        this.cycleTextSize();
        break;
      case 'show_shortcuts':
        this.showShortcutsDialog();
        break;
    }
    
    this.analytics?.track('keyboard_shortcut_used', { action });
  }

  private setupScreenReaderSupport(): void {
    // Add ARIA labels to key elements
    this.enhanceAriaSupport();
    
    // Monitor focus changes
    document.addEventListener('focusin', this.handleFocusChange.bind(this));
  }

  private enhanceAriaSupport(): void {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link sr-only';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add landmarks
    const header = document.querySelector('header');
    if (header) header.setAttribute('role', 'banner');
    
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('role', 'main');
      main.id = 'main-content';
    }
    
    const nav = document.querySelector('nav');
    if (nav) nav.setAttribute('role', 'navigation');
  }

  private handleFocusChange(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    
    // Announce tile content when focused
    if (element.classList.contains('tile')) {
      const emoji = element.querySelector('.emoji')?.textContent || '';
      const text = element.querySelector('.text')?.textContent || '';
      this.announce(`${text} ${emoji}`);
    }
  }

  private trapFocus(): void {
    if (!this.focusTrap) return;
    
    const focusableElements = this.focusTrap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    this.focusTrap.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    });
    
    firstFocusable?.focus();
  }

  private getFocusableTiles(): NodeListOf<Element> {
    return document.querySelectorAll('.tile:not([disabled])');
  }

  private monitorSystemPreferences(): void {
    // Monitor reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches && !this.settings.reduceMotion) {
        this.updateSettings({ reduceMotion: true });
        this.announce('Reduced motion enabled based on system preference');
      }
    });
    
    // Monitor high contrast preference
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches && !this.settings.highContrast) {
        this.updateSettings({ highContrast: true });
        this.announce('High contrast enabled based on system preference');
      }
    });
  }

  private showShortcutsDialog(): void {
    // Create and show shortcuts dialog
    const dialog = document.createElement('div');
    dialog.className = 'shortcuts-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-label', 'Keyboard shortcuts');
    
    const content = `
      <h2>Keyboard Shortcuts</h2>
      <ul>
        ${this.shortcuts.map(s => `
          <li>
            <kbd>${s.modifiers.concat(s.key).join(' + ')}</kbd>
            <span>${s.description}</span>
          </li>
        `).join('')}
      </ul>
      <button onclick="this.parentElement.remove()">Close</button>
    `;
    
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
    
    this.setFocusTrap(dialog);
  }

  private saveCustomShortcuts(): void {
    const customShortcuts = this.shortcuts.filter(s => 
      !['navigate_forward', 'navigate_backward', 'select_tile', 'speak_tile', 
        'clear_sentence', 'toggle_settings', 'toggle_high_contrast', 
        'increase_text_size', 'decrease_text_size', 'show_shortcuts'].includes(s.action)
    );
    
    localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts));
  }

  private loadCustomShortcuts(): void {
    const saved = localStorage.getItem('customShortcuts');
    if (saved) {
      try {
        const customShortcuts = JSON.parse(saved);
        this.shortcuts.push(...customShortcuts);
      } catch (error) {
        console.error('Failed to load custom shortcuts:', error);
      }
    }
  }
}

// Singleton getter
export function getAccessibilityService(): AccessibilityService {
  return AccessibilityService.getInstance();
}