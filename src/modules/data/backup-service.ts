/**
 * Backup Service
 * Module 49: Automated backup and restore functionality
 */

interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  size: number;
  version: string;
  deviceInfo: {
    platform: string;
    userAgent: string;
    screenResolution: string;
  };
  modules: string[];
  statistics: {
    boards: number;
    tiles: number;
    users: number;
    sessions: number;
    customContent: number;
  };
}

interface BackupData {
  metadata: BackupMetadata;
  data: {
    boards: any[];
    tiles: any[];
    users: any[];
    settings: any;
    sequences: any[];
    goals: any[];
    assessments: any[];
    customContent: any[];
    analytics: any;
  };
  encrypted: boolean;
  checksum: string;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  lastBackup?: string;
  nextBackup?: string;
  retentionCount: number;
}

interface RestoreOptions {
  overwrite: boolean;
  mergeStrategy: 'replace' | 'merge' | 'skip';
  selectedModules?: string[];
  dryRun?: boolean;
}

export class BackupService {
  private static instance: BackupService;
  private backups: Map<string, BackupMetadata> = new Map();
  private schedule: BackupSchedule = {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionCount: 7
  };
  private isBackingUp = false;
  private isRestoring = false;
  private encryptionKey: string | null = null;

  private constructor() {
    this.initializeSchedule();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  initialize(): void {
    console.log('💾 Backup Service ready - Automated backup and restore');
    this.loadBackupMetadata();
    this.startScheduledBackups();
    this.performInitialBackup();
  }

  /**
   * Create a backup
   */
  async createBackup(
    name?: string,
    description?: string,
    encrypt = false
  ): Promise<string | null> {
    if (this.isBackingUp) {
      console.warn('Backup already in progress');
      return null;
    }

    this.isBackingUp = true;
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log('📦 Creating backup...');

      // Collect data from all modules
      const backupData = await this.collectBackupData();

      // Generate metadata
      const metadata: BackupMetadata = {
        id: backupId,
        name: name || `Backup ${new Date().toLocaleString()}`,
        description,
        createdAt: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        version: '1.0.0',
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        },
        modules: this.getActiveModules(),
        statistics: this.calculateStatistics(backupData)
      };

      // Create backup package
      const backup: BackupData = {
        metadata,
        data: backupData,
        encrypted: encrypt,
        checksum: await this.generateChecksum(backupData)
      };

      // Encrypt if requested
      if (encrypt && this.encryptionKey) {
        backup.data = await this.encryptData(backup.data);
      }

      // Store backup
      await this.storeBackup(backup);
      this.backups.set(backupId, metadata);

      // Clean up old backups
      this.cleanupOldBackups();

      // Log audit event
      const auditService = (window as any).moduleSystem?.get('AuditService');
      auditService?.log('create', 'backup', {
        resourceId: backupId,
        resourceName: metadata.name,
        metadata: { size: metadata.size, encrypted: encrypt }
      });

      console.log(`✅ Backup created: ${metadata.name}`);
      this.isBackingUp = false;

      return backupId;

    } catch (error) {
      console.error('Backup failed:', error);
      this.isBackingUp = false;
      return null;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(
    backupId: string,
    options: RestoreOptions = { overwrite: false, mergeStrategy: 'merge' }
  ): Promise<boolean> {
    if (this.isRestoring) {
      console.warn('Restore already in progress');
      return false;
    }

    this.isRestoring = true;

    try {
      console.log('📥 Restoring backup...');

      // Load backup data
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Verify checksum
      const isValid = await this.verifyChecksum(backup);
      if (!isValid) {
        throw new Error('Backup integrity check failed');
      }

      // Decrypt if needed
      let data = backup.data;
      if (backup.encrypted && this.encryptionKey) {
        data = await this.decryptData(data);
      }

      // Dry run if requested
      if (options.dryRun) {
        const report = this.generateRestoreReport(data, options);
        console.log('Dry run complete:', report);
        this.isRestoring = false;
        return true;
      }

      // Perform restore
      await this.performRestore(data, options);

      // Update last restore info
      this.updateRestoreInfo(backupId);

      // Log audit event
      const auditService = (window as any).moduleSystem?.get('AuditService');
      auditService?.log('read', 'backup', {
        resourceId: backupId,
        resourceName: backup.metadata.name,
        metadata: { restored: true, options }
      });

      console.log('✅ Backup restored successfully');
      this.isRestoring = false;

      // Reload UI
      window.location.reload();

      return true;

    } catch (error) {
      console.error('Restore failed:', error);
      this.isRestoring = false;
      return false;
    }
  }

  /**
   * Export backup to file
   */
  async exportBackup(backupId: string): Promise<Blob | null> {
    try {
      const backup = await this.loadBackup(backupId);
      if (!backup) return null;

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tinkybink_backup_${backup.metadata.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return blob;

    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<string | null> {
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupData;

      // Verify backup structure
      if (!backup.metadata || !backup.data || !backup.checksum) {
        throw new Error('Invalid backup file');
      }

      // Store imported backup
      await this.storeBackup(backup);
      this.backups.set(backup.metadata.id, backup.metadata);

      console.log(`📥 Imported backup: ${backup.metadata.name}`);
      return backup.metadata.id;

    } catch (error) {
      console.error('Import failed:', error);
      return null;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      this.backups.delete(backupId);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`backup_${backupId}`);
      }

      // Log audit event
      const auditService = (window as any).moduleSystem?.get('AuditService');
      auditService?.log('delete', 'backup', {
        resourceId: backupId
      });

      return true;

    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  /**
   * Get all backups
   */
  getBackups(): BackupMetadata[] {
    return Array.from(this.backups.values())
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Get backup by ID
   */
  getBackup(backupId: string): BackupMetadata | undefined {
    return this.backups.get(backupId);
  }

  /**
   * Update backup schedule
   */
  updateSchedule(schedule: Partial<BackupSchedule>): void {
    this.schedule = { ...this.schedule, ...schedule };
    this.saveSchedule();
    
    if (this.schedule.enabled) {
      this.startScheduledBackups();
    }
  }

  /**
   * Get backup schedule
   */
  getSchedule(): BackupSchedule {
    return { ...this.schedule };
  }

  /**
   * Set encryption key
   */
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  /**
   * Get backup statistics
   */
  getStatistics(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: string;
    newestBackup?: string;
    averageSize: number;
    encryptedCount: number;
  } {
    const backups = this.getBackups();
    
    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups[backups.length - 1]?.createdAt,
      newestBackup: backups[0]?.createdAt,
      averageSize: backups.length > 0 ? 
        backups.reduce((sum, b) => sum + b.size, 0) / backups.length : 0,
      encryptedCount: 0 // Would need to track this
    };
  }

  // Private helper methods
  private async collectBackupData(): Promise<any> {
    const data: any = {
      boards: [],
      tiles: [],
      users: [],
      settings: {},
      sequences: [],
      goals: [],
      assessments: [],
      customContent: [],
      analytics: {}
    };

    // Collect from each module
    const moduleSystem = (window as any).moduleSystem;
    
    // Boards and tiles
    const boardManager = moduleSystem?.get('BoardManager');
    if (boardManager) {
      data.boards = boardManager.getAllBoards();
    }

    const tileManagement = moduleSystem?.get('TileManagementService');
    if (tileManagement) {
      data.tiles = tileManagement.getAllTiles();
    }

    // Users and settings
    const accountService = moduleSystem?.get('AccountService');
    if (accountService) {
      data.users = accountService.getAllProfiles();
    }

    // Settings from all services
    data.settings = this.collectSettings();

    // Sequences
    const actionSequenceService = moduleSystem?.get('ActionSequenceService');
    if (actionSequenceService) {
      data.sequences = actionSequenceService.getSequences();
    }

    // Therapy goals
    const therapyGoalsService = moduleSystem?.get('TherapyGoalsService');
    if (therapyGoalsService) {
      data.goals = therapyGoalsService.getAllGoals();
    }

    // Assessments
    const skillAssessmentService = moduleSystem?.get('SkillAssessmentService');
    if (skillAssessmentService) {
      data.assessments = skillAssessmentService.getAllAssessments();
    }

    // Analytics
    const analyticsService = moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      data.analytics = analyticsService.getAnalyticsSummary();
    }

    return data;
  }

  private collectSettings(): any {
    const settings: any = {};

    // Collect settings from localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('settings') || key.includes('preferences')) {
          try {
            settings[key] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch {
            settings[key] = localStorage.getItem(key);
          }
        }
      });
    }

    return settings;
  }

  private async performRestore(data: any, options: RestoreOptions): Promise<void> {
    const moduleSystem = (window as any).moduleSystem;

    // Clear existing data if overwrite
    if (options.overwrite) {
      await this.clearAllData();
    }

    // Restore boards
    if (data.boards && (!options.selectedModules || options.selectedModules.includes('boards'))) {
      const boardManager = moduleSystem?.get('BoardManager');
      for (const board of data.boards) {
        await boardManager?.createBoard(board);
      }
    }

    // Restore tiles
    if (data.tiles && (!options.selectedModules || options.selectedModules.includes('tiles'))) {
      const tileManagement = moduleSystem?.get('TileManagementService');
      for (const tile of data.tiles) {
        await tileManagement?.createTile(tile);
      }
    }

    // Restore settings
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    // Restore other data...
    // Similar restoration for sequences, goals, assessments, etc.
  }

  private async clearAllData(): Promise<void> {
    // Clear localStorage except critical items
    const keysToKeep = ['auth_token', 'user_id'];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  private calculateStatistics(data: any): any {
    return {
      boards: data.boards?.length || 0,
      tiles: data.tiles?.length || 0,
      users: data.users?.length || 0,
      sessions: 0,
      customContent: data.customContent?.length || 0
    };
  }

  private getActiveModules(): string[] {
    const moduleSystem = (window as any).moduleSystem;
    return moduleSystem?.getModuleNames() || [];
  }

  private async generateChecksum(data: any): Promise<string> {
    const json = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyChecksum(backup: BackupData): Promise<boolean> {
    const calculatedChecksum = await this.generateChecksum(backup.data);
    return calculatedChecksum === backup.checksum;
  }

  private async encryptData(data: any): Promise<any> {
    // Simple encryption - in production use proper encryption
    const json = JSON.stringify(data);
    const encrypted = btoa(json);
    return { encrypted, algorithm: 'base64' };
  }

  private async decryptData(data: any): Promise<any> {
    if (data.algorithm === 'base64') {
      const decrypted = atob(data.encrypted);
      return JSON.parse(decrypted);
    }
    throw new Error('Unknown encryption algorithm');
  }

  private async storeBackup(backup: BackupData): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Store in localStorage (in production, use IndexedDB or cloud storage)
      localStorage.setItem(`backup_${backup.metadata.id}`, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to store backup:', error);
      throw error;
    }
  }

  private async loadBackup(backupId: string): Promise<BackupData | null> {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(`backup_${backupId}`);
      if (!data) return null;
      
      return JSON.parse(data) as BackupData;
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  private generateRestoreReport(data: any, options: RestoreOptions): any {
    return {
      itemsToRestore: {
        boards: data.boards?.length || 0,
        tiles: data.tiles?.length || 0,
        users: data.users?.length || 0,
        settings: Object.keys(data.settings || {}).length
      },
      strategy: options.mergeStrategy,
      overwrite: options.overwrite,
      estimatedTime: '2-5 minutes'
    };
  }

  private updateRestoreInfo(backupId: string): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('last_restore', JSON.stringify({
      backupId,
      timestamp: new Date().toISOString()
    }));
  }

  private cleanupOldBackups(): void {
    const backups = this.getBackups();
    
    if (backups.length > this.schedule.retentionCount) {
      const toDelete = backups.slice(this.schedule.retentionCount);
      toDelete.forEach(backup => {
        this.deleteBackup(backup.id);
      });
    }
  }

  private performInitialBackup(): void {
    // Create initial backup if none exist
    if (this.backups.size === 0) {
      setTimeout(() => {
        this.createBackup('Initial Backup', 'Automatic initial backup');
      }, 5000);
    }
  }

  private initializeSchedule(): void {
    // Load saved schedule
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('backup_schedule');
      if (saved) {
        this.schedule = { ...this.schedule, ...JSON.parse(saved) };
      }
    }
  }

  private startScheduledBackups(): void {
    if (!this.schedule.enabled) return;

    // Calculate next backup time
    const now = new Date();
    const nextBackup = this.calculateNextBackupTime(now);
    this.schedule.nextBackup = nextBackup.toISOString();

    // Schedule backup
    const delay = nextBackup.getTime() - now.getTime();
    setTimeout(() => {
      this.performScheduledBackup();
    }, delay);
  }

  private async performScheduledBackup(): Promise<void> {
    if (!this.schedule.enabled) return;

    const backupId = await this.createBackup(
      `Scheduled Backup`,
      `Automatic ${this.schedule.frequency} backup`
    );

    if (backupId) {
      this.schedule.lastBackup = new Date().toISOString();
    }

    // Schedule next backup
    this.startScheduledBackups();
  }

  private calculateNextBackupTime(from: Date): Date {
    const next = new Date(from);

    switch (this.schedule.frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        if (this.schedule.time) {
          const [hours, minutes] = this.schedule.time.split(':').map(Number);
          next.setHours(hours, minutes, 0, 0);
        }
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        if (this.schedule.dayOfWeek !== undefined) {
          while (next.getDay() !== this.schedule.dayOfWeek) {
            next.setDate(next.getDate() + 1);
          }
        }
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        if (this.schedule.dayOfMonth) {
          next.setDate(this.schedule.dayOfMonth);
        }
        break;
    }

    return next;
  }

  private loadBackupMetadata(): void {
    if (typeof window === 'undefined') return;

    try {
      const metadata = localStorage.getItem('backup_metadata');
      if (metadata) {
        const backups = JSON.parse(metadata);
        backups.forEach((meta: BackupMetadata) => {
          this.backups.set(meta.id, meta);
        });
      }
    } catch (error) {
      console.error('Failed to load backup metadata:', error);
    }
  }

  private saveSchedule(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('backup_schedule', JSON.stringify(this.schedule));
  }
}

// Export singleton getter function
export function getBackupService(): BackupService {
  return BackupService.getInstance();
}