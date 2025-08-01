// Module 14: Cloud Sync Service
// Handles cloud synchronization across devices

import { getDataService } from '../core/data-service';
import { getBoardManager } from '../core/board-manager';
import { getAnalyticsService } from '../core/analytics-service';
import { getImportExportService } from './import-export-service';

export interface SyncStatus {
  lastSync: Date | null;
  syncing: boolean;
  pendingChanges: number;
  syncError: string | null;
  devices: DeviceInfo[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'tablet' | 'phone';
  lastSeen: Date;
  isCurrent: boolean;
}

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncBoards: boolean;
  syncSettings: boolean;
  syncAnalytics: boolean;
  conflictResolution: 'local' | 'remote' | 'newest' | 'manual';
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private dataService: ReturnType<typeof getDataService> | null = null;
  private boardManager: ReturnType<typeof getBoardManager> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private importExport: ReturnType<typeof getImportExportService> | null = null;
  
  private syncStatus: SyncStatus = {
    lastSync: null,
    syncing: false,
    pendingChanges: 0,
    syncError: null,
    devices: []
  };
  
  private syncOptions: SyncOptions = {
    autoSync: true,
    syncInterval: 5,
    syncBoards: true,
    syncSettings: true,
    syncAnalytics: false,
    conflictResolution: 'newest'
  };
  
  private syncTimer: number | null = null;
  private changeQueue: Map<string, any> = new Map();
  private deviceId: string;
  private syncEndpoint = '/api/sync'; // Would be configured for production

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    console.log('CloudSyncService created with device ID:', this.deviceId);
  }

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  async initialize(): Promise<void> {
    this.dataService = getDataService();
    this.boardManager = getBoardManager();
    this.analytics = getAnalyticsService();
    this.importExport = getImportExportService();
    
    // Load sync options
    this.loadSyncOptions();
    
    // Register for changes
    this.registerChangeListeners();
    
    // Start auto-sync if enabled
    if (this.syncOptions.autoSync) {
      this.startAutoSync();
    }
    
    // Initial device registration
    await this.registerDevice();
    
    console.log('CloudSyncService initialized');
  }

  // Enable/disable cloud sync
  enableSync(enabled: boolean): void {
    this.syncOptions.autoSync = enabled;
    this.saveSyncOptions();
    
    if (enabled) {
      this.startAutoSync();
      this.performSync(); // Immediate sync
    } else {
      this.stopAutoSync();
    }
    
    this.analytics?.track('cloud_sync_toggled', { enabled });
  }

  // Perform manual sync
  async performSync(): Promise<boolean> {
    if (this.syncStatus.syncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.syncStatus.syncing = true;
    this.syncStatus.syncError = null;
    this.notifySyncStatusChange();

    try {
      // Get local data
      const localData = this.prepareLocalData();
      
      // In production, this would make an API call
      // For now, we'll simulate with localStorage across tabs
      const success = await this.simulateCloudSync(localData);
      
      if (success) {
        this.syncStatus.lastSync = new Date();
        this.syncStatus.pendingChanges = 0;
        this.changeQueue.clear();
        
        this.analytics?.track('cloud_sync_completed', {
          itemsSynced: Object.keys(localData).length
        });
      }
      
      return success;
    } catch (error) {
      this.syncStatus.syncError = (error as Error).message;
      this.analytics?.track('cloud_sync_failed', { error: this.syncStatus.syncError });
      return false;
    } finally {
      this.syncStatus.syncing = false;
      this.notifySyncStatusChange();
    }
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Get sync options
  getSyncOptions(): SyncOptions {
    return { ...this.syncOptions };
  }

  // Update sync options
  updateSyncOptions(options: Partial<SyncOptions>): void {
    this.syncOptions = { ...this.syncOptions, ...options };
    this.saveSyncOptions();
    
    // Restart auto-sync if interval changed
    if (options.syncInterval !== undefined || options.autoSync !== undefined) {
      this.stopAutoSync();
      if (this.syncOptions.autoSync) {
        this.startAutoSync();
      }
    }
    
    this.analytics?.track('sync_options_updated', options);
  }

  // Resolve sync conflict
  async resolveConflict(itemId: string, resolution: 'local' | 'remote'): Promise<void> {
    // In production, this would handle conflict resolution
    console.log(`Resolving conflict for ${itemId} with ${resolution}`);
    
    this.analytics?.track('sync_conflict_resolved', {
      itemId,
      resolution
    });
  }

  // Get list of synced devices
  async getDevices(): Promise<DeviceInfo[]> {
    // In production, fetch from server
    // For now, return from local state
    return this.syncStatus.devices;
  }

  // Remove device from sync
  async removeDevice(deviceId: string): Promise<void> {
    this.syncStatus.devices = this.syncStatus.devices.filter(d => d.id !== deviceId);
    
    this.analytics?.track('device_removed', { deviceId });
    
    // In production, notify server
    await this.notifyDeviceRemoval(deviceId);
  }

  // Private methods
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private async registerDevice(): Promise<void> {
    const deviceInfo: DeviceInfo = {
      id: this.deviceId,
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      lastSeen: new Date(),
      isCurrent: true
    };
    
    // Add to local devices list
    this.syncStatus.devices = [
      deviceInfo,
      ...this.syncStatus.devices.filter(d => d.id !== this.deviceId)
    ];
    
    // In production, register with server
    console.log('Device registered:', deviceInfo);
  }

  private getDeviceName(): string {
    // Try to get a meaningful device name
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    return 'Unknown Device';
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'phone' {
    const userAgent = navigator.userAgent;
    if (/iPad|Android.*tablet/i.test(userAgent)) return 'tablet';
    if (/iPhone|Android.*mobile/i.test(userAgent)) return 'phone';
    return 'desktop';
  }

  private registerChangeListeners(): void {
    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for board changes
    window.addEventListener('boardChanged', this.handleBoardChange.bind(this));
    
    // Listen for settings changes
    window.addEventListener('settingsChanged', this.handleSettingsChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key?.startsWith('tinkyBink_sync_')) {
      // Another tab made changes
      this.handleRemoteChange(event);
    }
  }

  private handleBoardChange(event: Event): void {
    const customEvent = event as CustomEvent;
    this.queueChange('board', customEvent.detail);
  }

  private handleSettingsChange(event: Event): void {
    const customEvent = event as CustomEvent;
    this.queueChange('settings', customEvent.detail);
  }

  private queueChange(type: string, data: any): void {
    this.changeQueue.set(`${type}_${Date.now()}`, { type, data });
    this.syncStatus.pendingChanges = this.changeQueue.size;
    this.notifySyncStatusChange();
  }

  private prepareLocalData(): any {
    const data: any = {};
    
    if (this.syncOptions.syncBoards) {
      data.boards = this.boardManager?.getAllBoards() || [];
    }
    
    if (this.syncOptions.syncSettings) {
      data.settings = this.importExport?.exportSettings().data.settings;
    }
    
    if (this.syncOptions.syncAnalytics) {
      data.analytics = this.analytics?.exportAnalytics();
    }
    
    data.deviceId = this.deviceId;
    data.timestamp = new Date().toISOString();
    
    return data;
  }

  private async simulateCloudSync(data: any): Promise<boolean> {
    // Simulate cloud sync using localStorage
    // In production, this would be an API call
    
    const syncKey = `tinkyBink_sync_${Date.now()}`;
    localStorage.setItem(syncKey, JSON.stringify(data));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up old sync data
    this.cleanupOldSyncData();
    
    return true;
  }

  private handleRemoteChange(event: StorageEvent): void {
    if (!event.newValue) return;
    
    try {
      const remoteData = JSON.parse(event.newValue);
      
      // Don't process our own changes
      if (remoteData.deviceId === this.deviceId) return;
      
      // Apply remote changes based on conflict resolution
      this.applyRemoteChanges(remoteData);
      
    } catch (error) {
      console.error('Failed to process remote change:', error);
    }
  }

  private applyRemoteChanges(remoteData: any): void {
    const shouldApply = this.shouldApplyRemoteChange(remoteData);
    
    if (!shouldApply) return;
    
    // Apply changes through import/export service
    if (remoteData.boards && this.syncOptions.syncBoards) {
      this.importExport?.importFromData({
        version: '2.0',
        timestamp: remoteData.timestamp,
        type: 'boards',
        data: { boards: remoteData.boards }
      });
    }
    
    if (remoteData.settings && this.syncOptions.syncSettings) {
      this.importExport?.importFromData({
        version: '2.0',
        timestamp: remoteData.timestamp,
        type: 'settings',
        data: { settings: remoteData.settings }
      });
    }
    
    this.analytics?.track('remote_changes_applied', {
      fromDevice: remoteData.deviceId
    });
  }

  private shouldApplyRemoteChange(remoteData: any): boolean {
    switch (this.syncOptions.conflictResolution) {
      case 'remote':
        return true;
      case 'local':
        return false;
      case 'newest':
        const remoteTime = new Date(remoteData.timestamp).getTime();
        const localTime = this.syncStatus.lastSync?.getTime() || 0;
        return remoteTime > localTime;
      case 'manual':
        // Queue for manual resolution
        this.queueConflict(remoteData);
        return false;
      default:
        return true;
    }
  }

  private queueConflict(remoteData: any): void {
    // In production, queue conflicts for user resolution
    console.log('Conflict detected, queuing for manual resolution:', remoteData);
  }

  private startAutoSync(): void {
    if (this.syncTimer) return;
    
    const intervalMs = this.syncOptions.syncInterval * 60 * 1000;
    this.syncTimer = window.setInterval(() => {
      this.performSync();
    }, intervalMs);
    
    console.log(`Auto-sync started with ${this.syncOptions.syncInterval} minute interval`);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto-sync stopped');
    }
  }

  private loadSyncOptions(): void {
    const saved = localStorage.getItem('syncOptions');
    if (saved) {
      try {
        this.syncOptions = { ...this.syncOptions, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load sync options:', error);
      }
    }
  }

  private saveSyncOptions(): void {
    localStorage.setItem('syncOptions', JSON.stringify(this.syncOptions));
  }

  private notifySyncStatusChange(): void {
    window.dispatchEvent(new CustomEvent('syncStatusChanged', {
      detail: this.getSyncStatus()
    }));
  }

  private async notifyDeviceRemoval(deviceId: string): Promise<void> {
    // In production, notify server about device removal
    console.log('Notifying server about device removal:', deviceId);
  }

  private cleanupOldSyncData(): void {
    // Remove sync data older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('tinkyBink_sync_')) {
        const timestamp = parseInt(key.replace('tinkyBink_sync_', ''));
        if (timestamp < cutoff) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Singleton getter
export function getCloudSyncService(): CloudSyncService {
  return CloudSyncService.getInstance();
}