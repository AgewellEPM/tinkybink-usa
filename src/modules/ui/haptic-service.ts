export class HapticService {
  private supportsVibration: boolean;

  constructor() {
    this.supportsVibration = 'vibrate' in navigator;
    this.initialize();
  }

  initialize() {
    console.log('Haptic Service ready');
    if (!this.supportsVibration) {
      console.log('Vibration API not supported on this device');
    }
  }

  vibrate(pattern?: number | number[]) {
    if (!this.supportsVibration) return;

    try {
      if (pattern) {
        navigator.vibrate(pattern);
      } else {
        // Default haptic feedback
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Vibration error:', error);
    }
  }

  // Preset patterns
  tap() {
    this.vibrate(50);
  }

  doubleTap() {
    this.vibrate([50, 50, 50]);
  }

  longPress() {
    this.vibrate(200);
  }

  success() {
    this.vibrate([50, 100, 50]);
  }

  warning() {
    this.vibrate([100, 50, 100]);
  }

  error() {
    this.vibrate([200, 100, 200]);
  }

  notification() {
    this.vibrate([100, 50, 100, 50, 100]);
  }

  // Stop any ongoing vibration
  stop() {
    if (this.supportsVibration) {
      navigator.vibrate(0);
    }
  }

  isSupported(): boolean {
    return this.supportsVibration;
  }
}

// Singleton instance
let hapticServiceInstance: HapticService | null = null;

export function getHapticService(): HapticService {
  if (typeof window !== 'undefined' && !hapticServiceInstance) {
    hapticServiceInstance = new HapticService();
  }
  return hapticServiceInstance!;
}