/**
 * Welcome Service
 * Module 32: First-time user onboarding and welcome experience
 */

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  component: string;
  duration: number;
  skippable: boolean;
  required: boolean;
}

interface UserOnboarding {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: string;
  completedAt?: string;
  skipped: boolean;
  progress: number;
}

interface WelcomeConfiguration {
  showWelcome: boolean;
  enableTutorial: boolean;
  autoAdvance: boolean;
  stepDuration: number;
  requireCompletion: boolean;
}

export class WelcomeService {
  private static instance: WelcomeService;
  private onboardingSteps: WelcomeStep[] = [];
  private userOnboarding: Map<string, UserOnboarding> = new Map();
  private configuration: WelcomeConfiguration;
  private isWelcomeActive = false;
  private currentStepIndex = 0;

  private constructor() {
    this.configuration = {
      showWelcome: true,
      enableTutorial: true,
      autoAdvance: false,
      stepDuration: 5000,
      requireCompletion: false
    };
    
    this.initializeWelcomeSteps();
  }

  static getInstance(): WelcomeService {
    if (!WelcomeService.instance) {
      WelcomeService.instance = new WelcomeService();
    }
    return WelcomeService.instance;
  }

  initialize(): void {
    console.log('👋 Welcome Service ready - Onboarding new users');
    this.loadConfiguration();
    this.checkFirstTimeUser();
  }

  /**
   * Initialize welcome steps
   */
  private initializeWelcomeSteps(): void {
    this.onboardingSteps = [
      {
        id: 'welcome',
        title: 'Welcome to TinkyBink!',
        description: 'Your professional AAC communication tool with Medicare/Medicaid billing support.',
        component: 'WelcomeIntro',
        duration: 5000,
        skippable: false,
        required: true
      },
      {
        id: 'navigation',
        title: 'Getting Around',
        description: 'Learn how to navigate between different boards and categories.',
        component: 'NavigationTutorial',
        duration: 8000,
        skippable: true,
        required: false
      },
      {
        id: 'communication',
        title: 'Making Communication',
        description: 'Tap tiles to build sentences and communicate effectively.',
        component: 'CommunicationTutorial',
        duration: 10000,
        skippable: true,
        required: false
      },
      {
        id: 'customization',
        title: 'Personalize Your Experience',
        description: 'Customize boards, add your own tiles, and adjust settings.',
        component: 'CustomizationTutorial',
        duration: 8000,
        skippable: true,
        required: false
      },
      {
        id: 'healthcare',
        title: 'Healthcare Features',
        description: 'Professional tools for therapists, including billing and reporting.',
        component: 'HealthcareTutorial',
        duration: 12000,
        skippable: true,
        required: false
      },
      {
        id: 'games',
        title: 'Learning Games',
        description: 'Interactive games to improve communication skills.',
        component: 'GamesTutorial',
        duration: 6000,
        skippable: true,
        required: false
      },
      {
        id: 'collaboration',
        title: 'Collaboration Features',
        description: 'Work together with therapists and family members.',
        component: 'CollaborationTutorial',
        duration: 8000,
        skippable: true,
        required: false
      },
      {
        id: 'completion',
        title: 'You\'re All Set!',
        description: 'Welcome to TinkyBink! Start communicating and exploring.',
        component: 'WelcomeCompletion',
        duration: 4000,
        skippable: false,
        required: true
      }
    ];
  }

  /**
   * Check if user is first-time user
   */
  private checkFirstTimeUser(): void {
    if (typeof window === 'undefined') return;

    const userId = this.getCurrentUserId();
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${userId}`);
    
    if (!hasSeenWelcome && this.configuration.showWelcome) {
      // Small delay to ensure app is fully loaded
      setTimeout(() => {
        this.startWelcomeExperience();
      }, 1000);
    }
  }

  /**
   * Start welcome experience
   */
  async startWelcomeExperience(userId?: string): Promise<void> {
    const targetUserId = userId || this.getCurrentUserId();
    if (!targetUserId) return;

    // Check if already completed
    const existingOnboarding = this.userOnboarding.get(targetUserId);
    if (existingOnboarding?.completedAt) {
      console.log('User has already completed welcome experience');
      return;
    }

    const onboarding: UserOnboarding = {
      userId: targetUserId,
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      skipped: false,
      progress: 0
    };

    this.userOnboarding.set(targetUserId, onboarding);
    this.isWelcomeActive = true;
    this.currentStepIndex = 0;

    // Show welcome overlay
    this.showWelcomeOverlay();
    
    // Start first step
    await this.showStep(0);

    console.log('👋 Started welcome experience for user:', targetUserId);
  }

  /**
   * Show specific onboarding step
   */
  private async showStep(stepIndex: number): Promise<void> {
    if (stepIndex >= this.onboardingSteps.length) {
      await this.completeWelcome();
      return;
    }

    const step = this.onboardingSteps[stepIndex];
    const userId = this.getCurrentUserId();
    const onboarding = this.userOnboarding.get(userId);

    if (!onboarding) return;

    this.currentStepIndex = stepIndex;
    onboarding.currentStep = stepIndex;
    onboarding.progress = (stepIndex / this.onboardingSteps.length) * 100;

    // Update UI
    this.renderWelcomeStep(step);

    // Track analytics
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('onboarding_step_shown', {
        stepId: step.id,
        stepIndex,
        userId
      });
    }

    // Auto-advance if configured
    if (this.configuration.autoAdvance && step.skippable) {
      setTimeout(() => {
        if (this.currentStepIndex === stepIndex) { // Still on same step
          this.nextStep();
        }
      }, step.duration);
    }
  }

  /**
   * Move to next step
   */
  async nextStep(): Promise<void> {
    const userId = this.getCurrentUserId();
    const onboarding = this.userOnboarding.get(userId);
    
    if (!onboarding) return;

    const currentStep = this.onboardingSteps[this.currentStepIndex];
    if (currentStep) {
      onboarding.completedSteps.push(currentStep.id);
    }

    await this.showStep(this.currentStepIndex + 1);
  }

  /**
   * Go to previous step
   */
  async previousStep(): Promise<void> {
    if (this.currentStepIndex > 0) {
      await this.showStep(this.currentStepIndex - 1);
    }
  }

  /**
   * Skip current step
   */
  skipStep(): void {
    const currentStep = this.onboardingSteps[this.currentStepIndex];
    if (currentStep?.skippable) {
      this.nextStep();
    }
  }

  /**
   * Skip entire welcome experience
   */
  skipWelcome(): void {
    const userId = this.getCurrentUserId();
    const onboarding = this.userOnboarding.get(userId);
    
    if (onboarding) {
      onboarding.skipped = true;
      onboarding.completedAt = new Date().toISOString();
      onboarding.progress = 100;
    }

    this.completeWelcome();
  }

  /**
   * Complete welcome experience
   */
  private async completeWelcome(): Promise<void> {
    const userId = this.getCurrentUserId();
    const onboarding = this.userOnboarding.get(userId);

    if (onboarding) {
      onboarding.completedAt = new Date().toISOString();
      onboarding.progress = 100;
    }

    this.isWelcomeActive = false;
    this.hideWelcomeOverlay();

    // Mark as seen
    if (typeof window !== 'undefined') {
      localStorage.setItem(`welcome_seen_${userId}`, 'true');
      localStorage.setItem(`onboarding_${userId}`, JSON.stringify(onboarding));
    }

    // Track completion
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('onboarding_completed', {
        userId,
        skipped: onboarding?.skipped || false,
        completedSteps: onboarding?.completedSteps.length || 0,
        totalSteps: this.onboardingSteps.length
      });
    }

    // Show completion message
    this.showWelcomeComplete();

    console.log('✅ Welcome experience completed for user:', userId);
  }

  /**
   * Restart welcome experience
   */
  restartWelcome(): void {
    const userId = this.getCurrentUserId();
    
    // Clear previous onboarding data
    this.userOnboarding.delete(userId);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`welcome_seen_${userId}`);
      localStorage.removeItem(`onboarding_${userId}`);
    }

    // Start fresh
    this.startWelcomeExperience();
  }

  /**
   * Show welcome overlay
   */
  private showWelcomeOverlay(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    `;

    const container = document.createElement('div');
    container.id = 'welcome-container';
    container.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 90vw;
      color: white;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  /**
   * Hide welcome overlay
   */
  private hideWelcomeOverlay(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Render welcome step
   */
  private renderWelcomeStep(step: WelcomeStep): void {
    const container = document.getElementById('welcome-container');
    if (!container) return;

    const userId = this.getCurrentUserId();
    const onboarding = this.userOnboarding.get(userId);
    const progress = onboarding?.progress || 0;

    container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; margin-bottom: 20px;">
          <div style="background: white; height: 4px; border-radius: 2px; width: ${progress}%; transition: width 0.3s ease;"></div>
        </div>
        <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 10px;">
          Step ${this.currentStepIndex + 1} of ${this.onboardingSteps.length}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 28px;">${step.title}</h2>
        <p style="margin: 0; font-size: 18px; line-height: 1.5; opacity: 0.9;">
          ${step.description}
        </p>
      </div>

      <div id="step-content" style="margin-bottom: 30px;">
        ${this.getStepContent(step)}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
        <button onclick="window.welcomeService.skipWelcome()" 
                style="background: transparent; border: 1px solid rgba(255,255,255,0.3); 
                       color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer;">
          Skip Tour
        </button>
        
        <div style="display: flex; gap: 10px;">
          ${this.currentStepIndex > 0 ? `
            <button onclick="window.welcomeService.previousStep()" 
                    style="background: rgba(255,255,255,0.2); border: none; 
                           color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer;">
              ← Previous
            </button>
          ` : ''}
          
          <button onclick="window.welcomeService.nextStep()" 
                  style="background: white; border: none; color: #667eea; 
                         padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            ${this.currentStepIndex === this.onboardingSteps.length - 1 ? 'Get Started!' : 'Next →'}
          </button>
        </div>
      </div>
    `;

    // Expose service to window for button handlers
    (window as any).welcomeService = this;
  }

  /**
   * Get content for specific step
   */
  private getStepContent(step: WelcomeStep): string {
    switch (step.id) {
      case 'welcome':
        return `
          <div style="font-size: 48px; margin: 20px 0;">🎉</div>
          <p>Get ready to explore powerful communication tools designed for everyone!</p>
        `;
        
      case 'navigation':
        return `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
              <div>Home</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
              <div>Categories</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 8px;">⚙️</div>
              <div>Settings</div>
            </div>
          </div>
        `;
        
      case 'communication':
        return `
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 6px;">I</div>
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 6px;">want</div>
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 6px;">water</div>
            </div>
            <div style="opacity: 0.8;">Tap tiles to build sentences, then speak them!</div>
          </div>
        `;
        
      case 'games':
        return `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 8px;">🎮</div>
              <div>Learning Games</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 8px;">🧩</div>
              <div>Skill Building</div>
            </div>
          </div>
        `;
        
      default:
        return `<div style="font-size: 32px; margin: 20px 0;">✨</div>`;
    }
  }

  /**
   * Show welcome completion message
   */
  private showWelcomeComplete(): void {
    if (typeof window === 'undefined') return;

    // Show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = '🎉 Welcome tour completed! Start exploring TinkyBink.';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Get onboarding status
   */
  getOnboardingStatus(userId?: string): UserOnboarding | null {
    const targetUserId = userId || this.getCurrentUserId();
    return this.userOnboarding.get(targetUserId) || null;
  }

  /**
   * Check if welcome is active
   */
  isWelcomeActive(): boolean {
    return this.isWelcomeActive;
  }

  /**
   * Get current step
   */
  getCurrentStep(): WelcomeStep | null {
    return this.onboardingSteps[this.currentStepIndex] || null;
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<WelcomeConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.saveConfiguration();
  }

  /**
   * Get configuration
   */
  getConfiguration(): WelcomeConfiguration {
    return { ...this.configuration };
  }

  // Helper methods
  private getCurrentUserId(): string {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    return multiUserService?.getCurrentUser()?.id || 'anonymous';
  }

  private loadConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      const configData = localStorage.getItem('welcome_config');
      if (configData) {
        this.configuration = { ...this.configuration, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('Failed to load welcome configuration:', error);
    }
  }

  private saveConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('welcome_config', JSON.stringify(this.configuration));
    } catch (error) {
      console.error('Failed to save welcome configuration:', error);
    }
  }
}

// Export singleton getter function
export function getWelcomeService(): WelcomeService {
  return WelcomeService.getInstance();
}