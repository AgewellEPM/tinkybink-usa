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
import { readingSpellingGamesService } from '@/services/reading-spelling-games-service';
import { phonicsTileSystemService } from '@/services/phonics-tile-system';
import { memoryGamesService } from '@/services/memory-games-service';
import { aiProgressMonitorService } from '@/services/ai-progress-monitor';
import { gpt4AnalyticsService } from '@/services/gpt4-analytics-service';
import { userHistoryTrackingService } from '@/services/user-history-tracking-service';
import { gpt4FocusRecommendationsService } from '@/services/gpt4-focus-recommendations-service';
import { gameIntegrationTracker } from '@/services/game-integration-tracker';
import { personalizedRecommendationEngine } from '@/services/personalized-recommendation-engine';
import { realtimeUpdatesService } from '@/services/realtime-updates-service';
import { aiGameBuilderService } from '@/services/ai-game-builder-service';
import { RewardsSystemService, getRewardsSystemService } from './learning/rewards-system-service';
import { GamificationService, getGamificationService } from './learning/gamification-service';
import { CollaborationService, getCollaborationService } from './collaboration/collaboration-service';
import { MultiUserService, getMultiUserService } from './collaboration/multi-user-service';
import { SessionRecordingService, getSessionRecordingService } from './collaboration/session-recording-service';
import { RemoteAssistanceService, getRemoteAssistanceService } from './collaboration/remote-assistance-service';
import { SharedBoardsService, getSharedBoardsService } from './collaboration/shared-boards-service';
import { SmartDefaultsService, getSmartDefaultsService } from './communication/smart-defaults-service';
import { WelcomeService, getWelcomeService } from './communication/welcome-service';
import { NavigationService, getNavigationService } from './communication/navigation-service';
import { BottomNavService, getBottomNavService } from './communication/bottom-nav-service';
import { AccountService, getAccountService } from './communication/account-service';
// Customization Phase (36-40)
import { AuthService, getAuthService } from './customization/auth-service';
import { QuickCreateService, getQuickCreateService } from './customization/quick-create-service';
import { BoardSharingService, getBoardSharingService } from './customization/board-sharing-service';
import { BoardCreationService, getBoardCreationService } from './customization/board-creation-service';
import { TileOrganizationService, getTileOrganizationService } from './customization/tile-organization-service';
// AI & Integration Phase (41-45)
import { VisualHintsService, getVisualHintsService } from './ai/visual-hints-service';
import { ServiceAdapter, getServiceAdapter } from './integration/service-adapter';
import { APIIntegrationService, getAPIIntegrationService } from './integration/api-integration-service';
import { DeviceIntegrationService, getDeviceIntegrationService } from './integration/device-integration-service';
import { PlatformIntegrationService, getPlatformIntegrationService } from './integration/platform-integration-service';
// Enterprise Phase (46-47)
import { AuditService, getAuditService } from './enterprise/audit-service';
import { ComplianceService, getComplianceService } from './enterprise/compliance-service';
// Advanced Phase (48-50)
import { ActionSequenceService, getActionSequenceService } from './advanced/action-sequence-service';
import { BackupService, getBackupService } from './data/backup-service';
import { ContextService, getContextService } from './ai/context-service';
// Advanced Analytics Phase (51-55)
import { PredictiveAnalyticsService, getPredictiveAnalyticsService } from './analytics/predictive-analytics-service';
import { UsagePatternsService, getUsagePatternsService } from './analytics/usage-patterns-service';
import { PerformanceMetricsService, getPerformanceMetricsService } from './analytics/performance-metrics-service';
import { DataVisualizationService, getDataVisualizationService } from './analytics/data-visualization-service';
import { ReportGenerationService, getReportGenerationService } from './analytics/report-generation-service';
// Enterprise Features Phase (56-60)
import { MultiTenantService, getMultiTenantService } from './enterprise/multi-tenant-service';
import { RBACService, getRBACService } from './enterprise/rbac-service';
import { EnterpriseDashboardService, getEnterpriseDashboardService } from './enterprise/enterprise-dashboard-service';
import { ScalabilityService, getScalabilityService } from './enterprise/scalability-service';
import { EnterpriseIntegrationService, getEnterpriseIntegrationService } from './enterprise/enterprise-integration-service';

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
      
      // Learning & Games Phase (21-27)
      moduleSystemInstance.register('EducationalGamesService', getEducationalGamesService());
      moduleSystemInstance.register('MemoryTrainingService', getMemoryTrainingService());
      moduleSystemInstance.register('SkillAssessmentService', getSkillAssessmentService());
      moduleSystemInstance.register('GameTrackingService', getGameTrackingService());
      moduleSystemInstance.register('RewardsSystemService', getRewardsSystemService());
      moduleSystemInstance.register('GamificationService', getGamificationService());
      moduleSystemInstance.register('ReadingSpellingGamesService', readingSpellingGamesService);
      moduleSystemInstance.register('PhonicsTileSystemService', phonicsTileSystemService);
      moduleSystemInstance.register('MemoryGamesService', memoryGamesService);
      moduleSystemInstance.register('AIProgressMonitorService', aiProgressMonitorService);
      moduleSystemInstance.register('GPT4AnalyticsService', gpt4AnalyticsService);
      moduleSystemInstance.register('UserHistoryTrackingService', userHistoryTrackingService);
      moduleSystemInstance.register('GPT4FocusRecommendationsService', gpt4FocusRecommendationsService);
      moduleSystemInstance.register('GameIntegrationTracker', gameIntegrationTracker);
      moduleSystemInstance.register('PersonalizedRecommendationEngine', personalizedRecommendationEngine);
      moduleSystemInstance.register('RealtimeUpdatesService', realtimeUpdatesService);
      moduleSystemInstance.register('AIGameBuilderService', aiGameBuilderService);
      
      // Collaboration & Real-time Phase (26-30)
      moduleSystemInstance.register('CollaborationService', getCollaborationService());
      moduleSystemInstance.register('MultiUserService', getMultiUserService());
      moduleSystemInstance.register('SessionRecordingService', getSessionRecordingService());
      moduleSystemInstance.register('RemoteAssistanceService', getRemoteAssistanceService());
      moduleSystemInstance.register('SharedBoardsService', getSharedBoardsService());
      
      // Advanced Communication Phase (31-35)
      moduleSystemInstance.register('SmartDefaultsService', getSmartDefaultsService());
      moduleSystemInstance.register('WelcomeService', getWelcomeService());
      moduleSystemInstance.register('NavigationService', getNavigationService());
      moduleSystemInstance.register('BottomNavService', getBottomNavService());
      moduleSystemInstance.register('AccountService', getAccountService());
      
      // Customization Phase (36-40)
      moduleSystemInstance.register('AuthService', getAuthService());
      moduleSystemInstance.register('QuickCreateService', getQuickCreateService());
      moduleSystemInstance.register('BoardSharingService', getBoardSharingService());
      moduleSystemInstance.register('BoardCreationService', getBoardCreationService());
      moduleSystemInstance.register('TileOrganizationService', getTileOrganizationService());
      
      // AI & Integration Phase (41-45)
      moduleSystemInstance.register('VisualHintsService', getVisualHintsService());
      moduleSystemInstance.register('ServiceAdapter', getServiceAdapter());
      moduleSystemInstance.register('APIIntegrationService', getAPIIntegrationService());
      moduleSystemInstance.register('DeviceIntegrationService', getDeviceIntegrationService());
      moduleSystemInstance.register('PlatformIntegrationService', getPlatformIntegrationService());
      
      // Enterprise Phase (46-47)
      moduleSystemInstance.register('AuditService', getAuditService());
      moduleSystemInstance.register('ComplianceService', getComplianceService());
      
      // Advanced Phase (48-50)
      moduleSystemInstance.register('ActionSequenceService', getActionSequenceService());
      moduleSystemInstance.register('BackupService', getBackupService());
      moduleSystemInstance.register('ContextService', getContextService());
      
      // Advanced Analytics Phase (51-55)
      moduleSystemInstance.register('PredictiveAnalyticsService', getPredictiveAnalyticsService());
      moduleSystemInstance.register('UsagePatternsService', getUsagePatternsService());
      moduleSystemInstance.register('PerformanceMetricsService', getPerformanceMetricsService());
      moduleSystemInstance.register('DataVisualizationService', getDataVisualizationService());
      moduleSystemInstance.register('ReportGenerationService', getReportGenerationService());
      
      // Enterprise Features Phase (56-60)
      moduleSystemInstance.register('MultiTenantService', getMultiTenantService());
      moduleSystemInstance.register('RBACService', getRBACService());
      moduleSystemInstance.register('EnterpriseDashboardService', getEnterpriseDashboardService());
      moduleSystemInstance.register('ScalabilityService', getScalabilityService());
      moduleSystemInstance.register('EnterpriseIntegrationService', getEnterpriseIntegrationService());
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
  getRewardsSystemService,
  getGamificationService,
  getGameTrackingService,
  getCollaborationService,
  getMultiUserService,
  getSessionRecordingService,
  getRemoteAssistanceService,
  getSharedBoardsService,
  getSmartDefaultsService,
  getWelcomeService,
  getNavigationService,
  getBottomNavService,
  getAccountService,
  getAuthService,
  getQuickCreateService,
  getBoardSharingService,
  getBoardCreationService,
  getTileOrganizationService,
  getVisualHintsService,
  getServiceAdapter,
  getAPIIntegrationService,
  getDeviceIntegrationService,
  getPlatformIntegrationService,
  getAuditService,
  getComplianceService,
  getActionSequenceService,
  getBackupService,
  getContextService,
  getPredictiveAnalyticsService,
  getUsagePatternsService,
  getPerformanceMetricsService,
  getDataVisualizationService,
  getReportGenerationService,
  getMultiTenantService,
  getRBACService,
  getEnterpriseDashboardService,
  getScalabilityService,
  getEnterpriseIntegrationService
};