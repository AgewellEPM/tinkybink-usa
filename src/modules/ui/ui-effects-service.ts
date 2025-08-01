export class UIEffectsService {
  private celebrationContainer: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  initialize() {
    console.log('UI Effects Service ready');
    this.createCelebrationContainer();
  }

  private createCelebrationContainer() {
    this.celebrationContainer = document.createElement('div');
    this.celebrationContainer.id = 'celebration-container';
    this.celebrationContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(this.celebrationContainer);
  }

  triggerTileCelebration(element: HTMLElement, tile: any) {
    // Tile scale animation
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
      element.style.transform = 'scale(1.05)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);
    }, 50);

    // Ripple effect
    this.createRipple(element);

    // Emoji burst
    this.createEmojiBurst(element, tile.emoji || '✨');
  }

  private createRipple(element: HTMLElement) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    ripple.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(123, 63, 242, 0.5);
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: ripple 0.8s ease-out;
    `;

    this.celebrationContainer?.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }

  private createEmojiBurst(element: HTMLElement, emoji: string) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      const angle = (i / 6) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      particle.textContent = emoji;
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        font-size: 24px;
        pointer-events: none;
        animation: particle-float 1s ease-out forwards;
        --tx: ${x}px;
        --ty: ${y}px;
      `;

      this.celebrationContainer?.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  }

  showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    const notification = document.createElement('div');
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };

    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${icons[type]}</span>
      <span class="notification-text">${message}</span>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(26, 26, 26, 0.95);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transform: translateX(400px);
      transition: transform 0.3s ease-out;
      z-index: 10000;
    `;

    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Slide out and remove
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  animateBoardTransition(direction: 'forward' | 'back') {
    const grid = document.querySelector('.tiles-grid');
    if (!grid) return;

    const animationClass = direction === 'forward' ? 'slide-left' : 'slide-right';
    grid.classList.add(animationClass);
    
    setTimeout(() => {
      grid.classList.remove(animationClass);
    }, 300);
  }

  highlightElement(element: HTMLElement, duration: number = 2000) {
    const originalBoxShadow = element.style.boxShadow;
    element.style.boxShadow = '0 0 20px rgba(123, 63, 242, 0.8)';
    element.style.transition = 'box-shadow 0.3s ease';

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  }

  createLoadingSpinner(container: HTMLElement) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner-circle"></div>
      <style>
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        .spinner-circle {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(123, 63, 242, 0.2);
          border-top-color: #7b3ff2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    container.appendChild(spinner);
    return spinner;
  }

  removeLoadingSpinner(spinner: HTMLElement) {
    spinner.remove();
  }

  addGlobalStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes ripple {
        to {
          width: 200px;
          height: 200px;
          opacity: 0;
        }
      }

      @keyframes particle-float {
        to {
          transform: translate(var(--tx), var(--ty)) scale(0) rotate(360deg);
          opacity: 0;
        }
      }

      @keyframes slide-left {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slide-right {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .tile {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .tile:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      .tile:active {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Game-specific effects
  showGameStart(gameName: string): void {
    this.showMessage(`Starting: ${gameName}`, 'info');
  }

  showSuccess(): void {
    this.showMessage('Correct! 🎉', 'success');
  }

  showError(): void {
    this.showMessage('Try again! 💪', 'error');
  }

  showCelebration(): void {
    this.triggerFullScreenCelebration();
  }

  private triggerFullScreenCelebration(): void {
    // Create full screen celebration effect
    const celebration = document.createElement('div');
    celebration.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #FFD700, #FFA500, #FF69B4, #00CED1);
      background-size: 400% 400%;
      animation: celebrationGradient 2s ease-in-out;
      z-index: 10000;
      pointer-events: none;
      opacity: 0.8;
    `;
    
    document.body.appendChild(celebration);
    
    // Add confetti effect
    this.createConfetti();
    
    // Remove after animation
    setTimeout(() => {
      celebration.remove();
    }, 2000);
  }

  private createConfetti(): void {
    const colors = ['#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF4500'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        top: -10px;
        left: ${Math.random() * 100}%;
        animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
        z-index: 10001;
        pointer-events: none;
      `;
      
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 5000);
    }
  }

  // Accessibility effects
  disableAllEffects(): void {
    document.body.classList.add('effects-disabled');
  }

  enableAllEffects(): void {
    document.body.classList.remove('effects-disabled');
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    const message = document.createElement('div');
    message.textContent = text;
    message.className = `effect-message effect-${type}`;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }
}

// Singleton instance
let uiEffectsInstance: UIEffectsService | null = null;

export function getUIEffectsService(): UIEffectsService {
  if (typeof window !== 'undefined' && !uiEffectsInstance) {
    uiEffectsInstance = new UIEffectsService();
  }
  return uiEffectsInstance!;
}