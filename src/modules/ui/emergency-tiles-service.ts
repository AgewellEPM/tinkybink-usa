import { BoardTile } from '../core/board-manager';
import { getSpeechService } from '../core/speech-service';
import { getUIEffectsService } from './ui-effects-service';

export interface EmergencyTile extends BoardTile {
  priority: 'critical' | 'high' | 'medium';
  quickAccess: boolean;
  notifyCaregiver?: boolean;
}

export class EmergencyTilesService {
  private emergencyTiles: EmergencyTile[] = [];
  private speechService: ReturnType<typeof getSpeechService> | null = null;
  private uiEffects: ReturnType<typeof getUIEffectsService> | null = null;

  initialize() {
    console.log('Emergency Tiles Service ready');
    this.speechService = getSpeechService();
    this.uiEffects = getUIEffectsService();
    this.setupDefaultEmergencyTiles();
  }

  private setupDefaultEmergencyTiles() {
    this.emergencyTiles = [
      {
        id: 'emergency_help',
        emoji: '🆘',
        text: 'HELP',
        speech: 'I need help now!',
        color: 'tile-emergency',
        priority: 'critical',
        quickAccess: true,
        notifyCaregiver: true
      },
      {
        id: 'emergency_pain',
        emoji: '🤕',
        text: 'PAIN',
        speech: 'I am in pain!',
        color: 'tile-emergency',
        priority: 'critical',
        quickAccess: true,
        notifyCaregiver: true
      },
      {
        id: 'emergency_bathroom',
        emoji: '🚽',
        text: 'BATHROOM NOW',
        speech: 'I need the bathroom urgently!',
        color: 'tile-emergency',
        priority: 'high',
        quickAccess: true
      },
      {
        id: 'emergency_cant_breathe',
        emoji: '😰',
        text: "CAN'T BREATHE",
        speech: 'I cannot breathe well!',
        color: 'tile-emergency',
        priority: 'critical',
        quickAccess: true,
        notifyCaregiver: true
      },
      {
        id: 'emergency_sick',
        emoji: '🤢',
        text: 'FEEL SICK',
        speech: 'I feel very sick!',
        color: 'tile-emergency',
        priority: 'high',
        quickAccess: true
      },
      {
        id: 'emergency_scared',
        emoji: '😱',
        text: 'SCARED',
        speech: 'I am scared!',
        color: 'tile-emergency',
        priority: 'medium',
        quickAccess: true
      },
      {
        id: 'emergency_stop',
        emoji: '🛑',
        text: 'STOP',
        speech: 'Stop! Please stop!',
        color: 'tile-emergency',
        priority: 'high',
        quickAccess: true
      },
      {
        id: 'emergency_no',
        emoji: '❌',
        text: 'NO NO NO',
        speech: 'No! I do not want this!',
        color: 'tile-emergency',
        priority: 'high',
        quickAccess: true
      },
      {
        id: 'emergency_yes',
        emoji: '✅',
        text: 'YES',
        speech: 'Yes',
        color: 'tile-yes',
        priority: 'medium',
        quickAccess: true
      }
    ];
  }

  getEmergencyTiles(): EmergencyTile[] {
    return [...this.emergencyTiles];
  }

  getQuickAccessTiles(): EmergencyTile[] {
    return this.emergencyTiles.filter(tile => tile.quickAccess);
  }

  getCriticalTiles(): EmergencyTile[] {
    return this.emergencyTiles.filter(tile => tile.priority === 'critical');
  }

  triggerEmergency(tileId: string) {
    const tile = this.emergencyTiles.find(t => t.id === tileId);
    if (!tile) return;

    // Immediate speech with increased volume
    if (this.speechService) {
      const currentSettings = this.speechService.getSettings();
      this.speechService.updateSettings({ volume: 1 }); // Max volume
      this.speechService.speak(tile.speech || tile.text);
      
      // Restore original volume after speaking
      setTimeout(() => {
        this.speechService?.updateSettings({ volume: currentSettings.volume });
      }, 2000);
    }

    // Visual alert
    if (this.uiEffects) {
      this.flashScreen();
      this.uiEffects.showNotification(
        `Emergency: ${tile.text}`,
        'error'
      );
    }

    // Notify caregiver if needed
    if (tile.notifyCaregiver) {
      this.notifyCaregiver(tile);
    }

    // Log emergency event
    this.logEmergencyEvent(tile);
  }

  private flashScreen() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.5);
      z-index: 10000;
      pointer-events: none;
      animation: emergency-flash 0.5s ease-in-out 3;
    `;

    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1500);
  }

  private notifyCaregiver(tile: EmergencyTile) {
    // In a real implementation, this would send notifications
    console.log('EMERGENCY NOTIFICATION:', {
      tile: tile.text,
      speech: tile.speech,
      timestamp: new Date().toISOString(),
      priority: tile.priority
    });

    // Store emergency event
    const emergencyEvents = JSON.parse(
      localStorage.getItem('emergency_events') || '[]'
    );
    emergencyEvents.push({
      tileId: tile.id,
      text: tile.text,
      timestamp: Date.now(),
      priority: tile.priority
    });
    localStorage.setItem('emergency_events', JSON.stringify(emergencyEvents));
  }

  private logEmergencyEvent(tile: EmergencyTile) {
    const event = {
      type: 'emergency',
      tileId: tile.id,
      text: tile.text,
      priority: tile.priority,
      timestamp: Date.now()
    };

    // Store in session
    const sessionEvents = JSON.parse(
      sessionStorage.getItem('emergency_session') || '[]'
    );
    sessionEvents.push(event);
    sessionStorage.setItem('emergency_session', JSON.stringify(sessionEvents));
  }

  addCustomEmergencyTile(tile: Omit<EmergencyTile, 'id'>): EmergencyTile {
    const newTile: EmergencyTile = {
      ...tile,
      id: `emergency_custom_${Date.now()}`
    };

    this.emergencyTiles.push(newTile);
    this.saveCustomEmergencyTiles();

    return newTile;
  }

  removeCustomEmergencyTile(tileId: string): boolean {
    const index = this.emergencyTiles.findIndex(t => t.id === tileId);
    if (index === -1 || !tileId.startsWith('emergency_custom_')) {
      return false;
    }

    this.emergencyTiles.splice(index, 1);
    this.saveCustomEmergencyTiles();

    return true;
  }

  private saveCustomEmergencyTiles() {
    const customTiles = this.emergencyTiles.filter(t => 
      t.id.startsWith('emergency_custom_')
    );
    localStorage.setItem('custom_emergency_tiles', JSON.stringify(customTiles));
  }

  private loadCustomEmergencyTiles() {
    const saved = localStorage.getItem('custom_emergency_tiles');
    if (saved) {
      try {
        const customTiles = JSON.parse(saved);
        this.emergencyTiles.push(...customTiles);
      } catch (error) {
        console.error('Failed to load custom emergency tiles:', error);
      }
    }
  }

  getEmergencyHistory(limit: number = 50): Array<{
    tileId: string;
    text: string;
    timestamp: number;
    priority: string;
  }> {
    const events = JSON.parse(
      localStorage.getItem('emergency_events') || '[]'
    );
    return events.slice(-limit).reverse();
  }

  clearEmergencyHistory() {
    localStorage.removeItem('emergency_events');
    sessionStorage.removeItem('emergency_session');
  }
}

// Singleton instance
let emergencyTilesInstance: EmergencyTilesService | null = null;

export function getEmergencyTilesService(): EmergencyTilesService {
  if (!emergencyTilesInstance) {
    emergencyTilesInstance = new EmergencyTilesService();
  }
  return emergencyTilesInstance;
}