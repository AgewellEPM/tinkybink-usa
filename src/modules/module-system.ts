// Import all modules
import { SpeechService, getSpeechService } from './core/speech-service';
import { DataService, getDataService } from './core/data-service';
import { BoardManager, getBoardManager } from './core/board-manager';
import { ElizaService, getElizaService } from './core/eliza-service';
import { AnalyticsService, getAnalyticsService } from './core/analytics-service';
import { UIEffectsService, getUIEffectsService } from './ui/ui-effects-service';
import { TileManagementService, getTileManagementService } from './ui/tile-management-service';
import { EmergencyTilesService, getEmergencyTilesService } from './ui/emergency-tiles-service';
import { SessionTrackingService, getSessionTrackingService } from './ui/session-tracking-service';
import { HapticService, getHapticService } from './ui/haptic-service';
import { LanguageService, getLanguageService } from './communication/language-service';
import { VoiceRecognitionService, getVoiceRecognitionService } from './communication/voice-recognition-service';
import { ImportExportService, getImportExportService } from './communication/import-export-service';
import { CloudSyncService, getCloudSyncService } from './communication/cloud-sync-service';
import { AccessibilityService, getAccessibilityService } from './communication/accessibility-service';
import { TherapyGoalsService, getTherapyGoalsService } from './professional/therapy-goals-service';
import { ProfessionalDashboardService, getProfessionalDashboardService } from './professional/professional-dashboard-service';
import { BillingIntegrationService, getBillingIntegrationService } from './professional/billing-integration-service';
import { PrescriptionManagementService, getPrescriptionManagementService } from './professional/prescription-management-service';
import { ComplianceTrackingService, getComplianceTrackingService } from './professional/compliance-tracking-service';
import { EducationalGamesService, getEducationalGamesService } from './learning/educational-games-service';
import { MemoryTrainingService, getMemoryTrainingService } from './learning/memory-training-service';
import { SkillAssessmentService, getSkillAssessmentService } from './learning/skill-assessment-service';
import { getGameTrackingService } from '@/services/game-tracking';

export interface Module {
  initialize(): void | Promise<void>;
}

export class ModuleSystem {
  private modules = new Map<string, Module>();
  private initialized = false;

  constructor() {
    console.log('ModuleSystem created');
  }

  register(name: string, module: Module) {
    this.modules.set(name, module);
    console.log(`Module registered: ${name}`);
  }

  get(name: string): Module | undefined {
    return this.modules.get(name);
  }

  async initialize() {
    if (this.initialized) return;

    console.log(`Initializing ${this.modules.size} modules...`);
    
    for (const [name, module] of this.modules) {
      try {
        console.log(`Initializing ${name}...`);
        await module.initialize();
        console.log(`✓ ${name} initialized`);
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error);
      }
    }

    this.initialized = true;
    console.log('All modules initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }
}

// Global module system instance
let moduleSystemInstance: ModuleSystem | null = null;

export function getModuleSystem(): ModuleSystem {
  if (!moduleSystemInstance) {
    moduleSystemInstance = new ModuleSystem();
    
    // Register all core modules
    if (typeof window !== 'undefined') {
      // Foundation Phase (1-5)
      moduleSystemInstance.register('SpeechService', getSpeechService());
      moduleSystemInstance.register('DataService', getDataService());
      moduleSystemInstance.register('BoardManager', getBoardManager());
      moduleSystemInstance.register('ElizaService', getElizaService());
      moduleSystemInstance.register('AnalyticsService', getAnalyticsService());
      
      // UI Enhancement Phase (6-10)
      moduleSystemInstance.register('UIEffectsService', getUIEffectsService());
      moduleSystemInstance.register('TileManagementService', getTileManagementService());
      moduleSystemInstance.register('EmergencyTilesService', getEmergencyTilesService());
      moduleSystemInstance.register('SessionTrackingService', getSessionTrackingService());
      moduleSystemInstance.register('HapticService', getHapticService());
      
      // Communication Enhancement Phase (11-15)
      moduleSystemInstance.register('LanguageService', getLanguageService());
      moduleSystemInstance.register('VoiceRecognitionService', getVoiceRecognitionService());
      moduleSystemInstance.register('ImportExportService', getImportExportService());
      moduleSystemInstance.register('CloudSyncService', getCloudSyncService());
      moduleSystemInstance.register('AccessibilityService', getAccessibilityService());
      
      // Professional Features Phase (16-20)
      moduleSystemInstance.register('TherapyGoalsService', getTherapyGoalsService());
      moduleSystemInstance.register('ProfessionalDashboardService', getProfessionalDashboardService());
      moduleSystemInstance.register('BillingIntegrationService', getBillingIntegrationService());
      moduleSystemInstance.register('PrescriptionManagementService', getPrescriptionManagementService());
      moduleSystemInstance.register('ComplianceTrackingService', getComplianceTrackingService());
      
      // Learning & Games Phase (21-25)
      moduleSystemInstance.register('EducationalGamesService', getEducationalGamesService());
      moduleSystemInstance.register('MemoryTrainingService', getMemoryTrainingService());
      moduleSystemInstance.register('SkillAssessmentService', getSkillAssessmentService());
      moduleSystemInstance.register('GameTrackingService', getGameTrackingService());
    }
  }
  return moduleSystemInstance;
}

// Export service getters for convenience
export {
  getSpeechService,
  getDataService,
  getBoardManager,
  getElizaService,
  getAnalyticsService,
  getUIEffectsService,
  getTileManagementService,
  getEmergencyTilesService,
  getSessionTrackingService,
  getHapticService,
  getLanguageService,
  getVoiceRecognitionService,
  getImportExportService,
  getCloudSyncService,
  getAccessibilityService,
  getTherapyGoalsService,
  getProfessionalDashboardService,
  getBillingIntegrationService,
  getPrescriptionManagementService,
  getComplianceTrackingService,
  getEducationalGamesService,
  getMemoryTrainingService,
  getSkillAssessmentService,
  getGameTrackingService
};