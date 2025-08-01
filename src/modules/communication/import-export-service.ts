// Module 13: Import/Export Service
// Handles importing and exporting boards, settings, and user data

import { getDataService } from '../core/data-service';
import { getBoardManager } from '../core/board-manager';
import { getAnalyticsService } from '../core/analytics-service';
import { getLanguageService } from './language-service';

export interface ExportData {
  version: string;
  timestamp: string;
  type: 'full' | 'boards' | 'settings' | 'analytics';
  data: {
    boards?: any[];
    settings?: any;
    analytics?: any;
    customTiles?: any[];
    userProfiles?: any[];
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    boards: number;
    tiles: number;
    settings: boolean;
    analytics: boolean;
  };
}

export class ImportExportService {
  private static instance: ImportExportService;
  private dataService: ReturnType<typeof getDataService> | null = null;
  private boardManager: ReturnType<typeof getBoardManager> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private languageService: ReturnType<typeof getLanguageService> | null = null;

  private constructor() {
    console.log('ImportExportService created');
  }

  static getInstance(): ImportExportService {
    if (!ImportExportService.instance) {
      ImportExportService.instance = new ImportExportService();
    }
    return ImportExportService.instance;
  }

  async initialize(): Promise<void> {
    this.dataService = getDataService();
    this.boardManager = getBoardManager();
    this.analytics = getAnalyticsService();
    this.languageService = getLanguageService();
    console.log('ImportExportService initialized');
  }

  // Export all data
  exportAll(): ExportData {
    const exportData: ExportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      type: 'full',
      data: {}
    };

    // Export boards
    const boards = this.boardManager?.getAllBoards() || [];
    exportData.data.boards = boards;

    // Export settings
    const settings = this.getSettings();
    exportData.data.settings = settings;

    // Export analytics data
    const analyticsData = this.analytics?.exportAnalytics();
    exportData.data.analytics = analyticsData;

    // Export custom tiles
    const customTiles = this.dataService?.getCustomTiles() || [];
    exportData.data.customTiles = customTiles;

    this.analytics?.track('data_exported', {
      type: 'full',
      boardCount: boards.length,
      tileCount: customTiles.length
    });

    return exportData;
  }

  // Export only boards
  exportBoards(): ExportData {
    const boards = this.boardManager?.getAllBoards() || [];
    
    const exportData: ExportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      type: 'boards',
      data: {
        boards
      }
    };

    this.analytics?.track('boards_exported', {
      boardCount: boards.length
    });

    return exportData;
  }

  // Export settings
  exportSettings(): ExportData {
    const settings = this.getSettings();
    
    const exportData: ExportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      type: 'settings',
      data: {
        settings
      }
    };

    this.analytics?.track('settings_exported');

    return exportData;
  }

  // Download export as file
  downloadExport(data: ExportData, filename?: string): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `tinkyBink-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.analytics?.track('export_downloaded', {
      filename: a.download,
      type: data.type
    });
  }

  // Import data from file
  async importData(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      
      return this.importFromData(data);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to read or parse file',
        imported: {
          boards: 0,
          tiles: 0,
          settings: false,
          analytics: false
        }
      };
    }
  }

  // Import from data object
  async importFromData(importData: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: 'Import successful',
      imported: {
        boards: 0,
        tiles: 0,
        settings: false,
        analytics: false
      }
    };

    try {
      // Validate version compatibility
      if (!this.isVersionCompatible(importData.version)) {
        result.success = false;
        result.message = 'Incompatible version';
        return result;
      }

      // Import boards
      if (importData.data.boards) {
        for (const board of importData.data.boards) {
          this.boardManager?.createBoard(board);
          result.imported.boards++;
        }
      }

      // Import custom tiles
      if (importData.data.customTiles) {
        for (const tile of importData.data.customTiles) {
          this.dataService?.addCustomTile(tile);
          result.imported.tiles++;
        }
      }

      // Import settings
      if (importData.data.settings) {
        this.importSettings(importData.data.settings);
        result.imported.settings = true;
      }

      // Import analytics (if allowed)
      if (importData.data.analytics && this.shouldImportAnalytics()) {
        this.analytics?.importAnalytics(importData.data.analytics);
        result.imported.analytics = true;
      }

      this.analytics?.track('data_imported', {
        type: importData.type,
        boards: result.imported.boards,
        tiles: result.imported.tiles,
        settings: result.imported.settings,
        analytics: result.imported.analytics
      });

    } catch (error) {
      result.success = false;
      result.message = 'Import failed: ' + (error as Error).message;
    }

    return result;
  }

  // Generate QR code for sharing
  generateShareableLink(data: ExportData): string {
    // In production, this would upload to a secure server
    // For now, we'll create a data URI
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}/import?data=${encoded}`;
    
    this.analytics?.track('shareable_link_generated', {
      type: data.type
    });

    return url;
  }

  // Import from shareable link
  async importFromLink(encodedData: string): Promise<ImportResult> {
    try {
      const decoded = atob(encodedData);
      const data = JSON.parse(decoded) as ExportData;
      return this.importFromData(data);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or corrupted link',
        imported: {
          boards: 0,
          tiles: 0,
          settings: false,
          analytics: false
        }
      };
    }
  }

  // Backup to browser storage
  async createLocalBackup(): Promise<void> {
    const backup = this.exportAll();
    const key = `tinkyBink_backup_${Date.now()}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(backup));
      
      // Keep only last 5 backups
      this.cleanupOldBackups(5);
      
      this.analytics?.track('local_backup_created');
    } catch (error) {
      console.error('Failed to create local backup:', error);
    }
  }

  // Restore from latest backup
  async restoreFromBackup(): Promise<ImportResult> {
    const backups = this.getLocalBackups();
    if (backups.length === 0) {
      return {
        success: false,
        message: 'No backups found',
        imported: {
          boards: 0,
          tiles: 0,
          settings: false,
          analytics: false
        }
      };
    }

    const latest = backups[0];
    const data = JSON.parse(localStorage.getItem(latest.key) || '{}') as ExportData;
    
    return this.importFromData(data);
  }

  // Get list of local backups
  getLocalBackups(): Array<{ key: string; timestamp: string; date: Date }> {
    const backups: Array<{ key: string; timestamp: string; date: Date }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tinkyBink_backup_')) {
        const timestamp = key.replace('tinkyBink_backup_', '');
        backups.push({
          key,
          timestamp,
          date: new Date(parseInt(timestamp))
        });
      }
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Private helper methods
  private getSettings(): any {
    return {
      speech: {
        rate: localStorage.getItem('speechRate') || '1',
        pitch: localStorage.getItem('speechPitch') || '1',
        volume: localStorage.getItem('speechVolume') || '1',
        voice: localStorage.getItem('selectedVoice') || ''
      },
      display: {
        gridColumns: localStorage.getItem('gridColumns') || '3',
        tileScale: localStorage.getItem('tileScale') || '1',
        theme: localStorage.getItem('theme') || 'default'
      },
      language: this.languageService?.getCurrentLanguage() || 'en',
      accessibility: {
        highContrast: localStorage.getItem('highContrast') === 'true',
        largeText: localStorage.getItem('largeText') === 'true',
        reduceMotion: localStorage.getItem('reduceMotion') === 'true'
      }
    };
  }

  private importSettings(settings: any): void {
    if (settings.speech) {
      localStorage.setItem('speechRate', settings.speech.rate);
      localStorage.setItem('speechPitch', settings.speech.pitch);
      localStorage.setItem('speechVolume', settings.speech.volume);
      localStorage.setItem('selectedVoice', settings.speech.voice);
    }

    if (settings.display) {
      localStorage.setItem('gridColumns', settings.display.gridColumns);
      localStorage.setItem('tileScale', settings.display.tileScale);
      localStorage.setItem('theme', settings.display.theme);
    }

    if (settings.language) {
      this.languageService?.setLanguage(settings.language);
    }

    if (settings.accessibility) {
      localStorage.setItem('highContrast', settings.accessibility.highContrast.toString());
      localStorage.setItem('largeText', settings.accessibility.largeText.toString());
      localStorage.setItem('reduceMotion', settings.accessibility.reduceMotion.toString());
    }

    // Dispatch event to update UI
    window.dispatchEvent(new Event('settingsImported'));
  }

  private isVersionCompatible(version: string): boolean {
    const major = parseInt(version.split('.')[0]);
    return major >= 2; // Compatible with version 2.x
  }

  private shouldImportAnalytics(): boolean {
    // Check user preference or privacy settings
    return localStorage.getItem('allowAnalyticsImport') !== 'false';
  }

  private cleanupOldBackups(keepCount: number): void {
    const backups = this.getLocalBackups();
    if (backups.length > keepCount) {
      backups.slice(keepCount).forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }
}

// Singleton getter
export function getImportExportService(): ImportExportService {
  return ImportExportService.getInstance();
}