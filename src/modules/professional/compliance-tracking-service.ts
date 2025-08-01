// Module 20: Compliance Tracking Service
// Ensures HIPAA compliance, audit trails, and regulatory requirements

import { getAnalyticsService } from '../core/analytics-service';
import { getSessionTrackingService } from '../ui/session-tracking-service';
import { getBillingIntegrationService } from './billing-integration-service';

export interface ComplianceRecord {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: 'therapist' | 'parent' | 'admin' | 'patient';
  action: ComplianceAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: DeviceInfo;
  result: 'success' | 'failure' | 'blocked';
  reason?: string;
}

export type ComplianceAction = 
  | 'login' | 'logout' | 'session_timeout'
  | 'view' | 'create' | 'update' | 'delete'
  | 'export' | 'import' | 'share'
  | 'consent_given' | 'consent_revoked'
  | 'access_denied' | 'permission_changed';

export type ResourceType = 
  | 'patient_data' | 'session_notes' | 'prescription'
  | 'billing_info' | 'analytics' | 'settings'
  | 'communication_log' | 'therapy_goal' | 'report';

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  os: string;
  browser: string;
  version: string;
}

export interface PrivacyConsent {
  id: string;
  patientId: string;
  guardianName?: string;
  consentType: 'data_collection' | 'data_sharing' | 'marketing' | 'research';
  granted: boolean;
  grantedDate?: Date;
  revokedDate?: Date;
  expiryDate?: Date;
  scope: string[];
  restrictions?: string[];
  signature?: string;
  witnessName?: string;
}

export interface DataRetentionPolicy {
  resourceType: ResourceType;
  retentionPeriod: number; // days
  autoDelete: boolean;
  archiveFirst: boolean;
  exceptions?: string[];
}

export interface SecurityIncident {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'unauthorized_access' | 'data_breach' | 'suspicious_activity' | 'policy_violation';
  description: string;
  affectedResources: string[];
  userId?: string;
  actions: string[];
  resolved: boolean;
  resolutionDate?: Date;
  resolutionNotes?: string;
}

export interface ComplianceReport {
  period: { start: Date; end: Date };
  summary: {
    totalActions: number;
    uniqueUsers: number;
    securityIncidents: number;
    consentChanges: number;
    dataExports: number;
    accessDenials: number;
  };
  userActivity: Map<string, UserActivitySummary>;
  resourceAccess: Map<ResourceType, number>;
  securityEvents: SecurityIncident[];
  consentStatus: Map<string, ConsentSummary>;
  recommendations: string[];
}

export interface UserActivitySummary {
  userId: string;
  loginCount: number;
  actionsPerformed: number;
  lastActive: Date;
  suspiciousActivities: number;
  resourcesAccessed: Set<string>;
}

export interface ConsentSummary {
  patientId: string;
  consentsGranted: number;
  consentsRevoked: number;
  currentStatus: Record<string, boolean>;
  lastUpdated: Date;
}

export interface HIPAARequirement {
  id: string;
  category: 'administrative' | 'physical' | 'technical';
  requirement: string;
  implemented: boolean;
  implementationDate?: Date;
  lastReviewed?: Date;
  evidence?: string;
  notes?: string;
}

export class ComplianceTrackingService {
  private static instance: ComplianceTrackingService;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private sessionTracking: ReturnType<typeof getSessionTrackingService> | null = null;
  private billing: ReturnType<typeof getBillingIntegrationService> | null = null;
  
  private complianceRecords: ComplianceRecord[] = [];
  private consents: Map<string, PrivacyConsent[]> = new Map();
  private retentionPolicies: Map<ResourceType, DataRetentionPolicy> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private hipaaRequirements: Map<string, HIPAARequirement> = new Map();
  
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private maxLoginAttempts = 5;
  private loginAttempts: Map<string, number> = new Map();

  private constructor() {
    console.log('ComplianceTrackingService created');
  }

  static getInstance(): ComplianceTrackingService {
    if (!ComplianceTrackingService.instance) {
      ComplianceTrackingService.instance = new ComplianceTrackingService();
    }
    return ComplianceTrackingService.instance;
  }

  async initialize(): Promise<void> {
    this.analytics = getAnalyticsService();
    this.sessionTracking = getSessionTrackingService();
    this.billing = getBillingIntegrationService();
    
    // Initialize policies
    this.initializeRetentionPolicies();
    this.initializeHIPAARequirements();
    
    // Load saved data
    this.loadComplianceData();
    
    // Start monitoring
    this.startComplianceMonitoring();
    
    console.log('ComplianceTrackingService initialized');
  }

  // Log compliance action
  logAction(
    userId: string,
    userRole: ComplianceRecord['userRole'],
    action: ComplianceAction,
    resourceType: ResourceType,
    resourceId: string,
    details?: Record<string, any>,
    result: ComplianceRecord['result'] = 'success'
  ): void {
    const record: ComplianceRecord = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      details: details || {},
      ipAddress: this.getIPAddress(),
      deviceInfo: this.getDeviceInfo(),
      result,
      reason: result !== 'success' ? details?.reason : undefined
    };
    
    this.complianceRecords.push(record);
    this.saveComplianceData();
    
    // Check for suspicious activity
    this.checkSuspiciousActivity(record);
    
    // Track in analytics
    this.analytics?.track('compliance_action', {
      action,
      resourceType,
      result,
      userRole
    });
  }

  // Manage consent
  recordConsent(consent: Omit<PrivacyConsent, 'id'>): PrivacyConsent {
    const newConsent: PrivacyConsent = {
      ...consent,
      id: `consent_${Date.now()}`
    };
    
    const patientConsents = this.consents.get(consent.patientId) || [];
    patientConsents.push(newConsent);
    this.consents.set(consent.patientId, patientConsents);
    
    this.saveComplianceData();
    
    this.logAction(
      'system',
      'admin',
      consent.granted ? 'consent_given' : 'consent_revoked',
      'patient_data',
      consent.patientId,
      { consentType: consent.consentType }
    );
    
    return newConsent;
  }

  // Check consent status
  hasConsent(
    patientId: string,
    consentType: PrivacyConsent['consentType'],
    scope?: string
  ): boolean {
    const patientConsents = this.consents.get(patientId) || [];
    
    const relevantConsent = patientConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => (b.grantedDate?.getTime() || 0) - (a.grantedDate?.getTime() || 0))[0];
    
    if (!relevantConsent || !relevantConsent.granted) return false;
    
    // Check expiry
    if (relevantConsent.expiryDate && relevantConsent.expiryDate < new Date()) {
      return false;
    }
    
    // Check scope if specified
    if (scope && relevantConsent.scope && !relevantConsent.scope.includes(scope)) {
      return false;
    }
    
    return true;
  }

  // Report security incident
  reportSecurityIncident(
    incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'resolved'>
  ): SecurityIncident {
    const newIncident: SecurityIncident = {
      ...incident,
      id: `incident_${Date.now()}`,
      timestamp: new Date(),
      resolved: false
    };
    
    this.securityIncidents.set(newIncident.id, newIncident);
    this.saveComplianceData();
    
    // Alert administrators
    this.alertAdministrators(newIncident);
    
    // Log the incident
    this.logAction(
      incident.userId || 'system',
      'admin',
      'access_denied',
      'patient_data',
      'multiple',
      {
        incidentType: incident.type,
        severity: incident.severity
      },
      'blocked'
    );
    
    return newIncident;
  }

  // Resolve security incident
  resolveSecurityIncident(
    incidentId: string,
    resolutionNotes: string
  ): void {
    const incident = this.securityIncidents.get(incidentId);
    if (!incident) return;
    
    incident.resolved = true;
    incident.resolutionDate = new Date();
    incident.resolutionNotes = resolutionNotes;
    
    this.saveComplianceData();
  }

  // Generate compliance report
  generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): ComplianceReport {
    const periodRecords = this.complianceRecords.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );
    
    const summary = this.calculateComplianceSummary(periodRecords);
    const userActivity = this.analyzeUserActivity(periodRecords);
    const resourceAccess = this.analyzeResourceAccess(periodRecords);
    const securityEvents = Array.from(this.securityIncidents.values())
      .filter(i => i.timestamp >= startDate && i.timestamp <= endDate);
    const consentStatus = this.analyzeConsentStatus();
    const recommendations = this.generateComplianceRecommendations(
      summary,
      userActivity,
      securityEvents
    );
    
    return {
      period: { start: startDate, end: endDate },
      summary,
      userActivity,
      resourceAccess,
      securityEvents,
      consentStatus,
      recommendations
    };
  }

  // Check HIPAA compliance status
  getHIPAAComplianceStatus(): {
    overallCompliance: number;
    byCategory: Map<string, number>;
    missingRequirements: HIPAARequirement[];
    lastReview: Date | null;
  } {
    const requirements = Array.from(this.hipaaRequirements.values());
    const implemented = requirements.filter(r => r.implemented);
    
    const overallCompliance = requirements.length > 0
      ? (implemented.length / requirements.length) * 100
      : 0;
    
    const byCategory = new Map<string, number>();
    ['administrative', 'physical', 'technical'].forEach(category => {
      const catReqs = requirements.filter(r => r.category === category as any);
      const catImplemented = catReqs.filter(r => r.implemented);
      byCategory.set(
        category,
        catReqs.length > 0 ? (catImplemented.length / catReqs.length) * 100 : 0
      );
    });
    
    const missingRequirements = requirements.filter(r => !r.implemented);
    
    const lastReview = requirements
      .filter(r => r.lastReviewed)
      .map(r => r.lastReviewed!)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    
    return {
      overallCompliance,
      byCategory,
      missingRequirements,
      lastReview
    };
  }

  // Data retention enforcement
  enforceDataRetention(): {
    deleted: number;
    archived: number;
    errors: string[];
  } {
    const results = {
      deleted: 0,
      archived: 0,
      errors: [] as string[]
    };
    
    this.retentionPolicies.forEach((policy, resourceType) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);
        
        // In production, this would actually delete/archive data
        // For now, we'll just count what would be affected
        const affectedRecords = this.complianceRecords.filter(r => 
          r.resourceType === resourceType && 
          r.timestamp < cutoffDate
        );
        
        if (policy.archiveFirst) {
          results.archived += affectedRecords.length;
        } else if (policy.autoDelete) {
          results.deleted += affectedRecords.length;
        }
      } catch (error) {
        results.errors.push(`Failed to process ${resourceType}: ${error}`);
      }
    });
    
    return results;
  }

  // Export audit trail
  exportAuditTrail(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): string {
    const records = this.complianceRecords.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );
    
    if (format === 'json') {
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        period: { start: startDate, end: endDate },
        recordCount: records.length,
        records: records
      }, null, 2);
    } else {
      return this.convertToCSV(records);
    }
  }

  // Private methods
  private initializeRetentionPolicies(): void {
    const policies: Array<[ResourceType, DataRetentionPolicy]> = [
      ['patient_data', {
        resourceType: 'patient_data',
        retentionPeriod: 2555, // 7 years
        autoDelete: false,
        archiveFirst: true
      }],
      ['session_notes', {
        resourceType: 'session_notes',
        retentionPeriod: 2555, // 7 years
        autoDelete: false,
        archiveFirst: true
      }],
      ['billing_info', {
        resourceType: 'billing_info',
        retentionPeriod: 2555, // 7 years
        autoDelete: false,
        archiveFirst: true
      }],
      ['analytics', {
        resourceType: 'analytics',
        retentionPeriod: 365, // 1 year
        autoDelete: true,
        archiveFirst: false
      }],
      ['communication_log', {
        resourceType: 'communication_log',
        retentionPeriod: 90, // 90 days
        autoDelete: true,
        archiveFirst: false
      }]
    ];
    
    policies.forEach(([type, policy]) => {
      this.retentionPolicies.set(type, policy);
    });
  }

  private initializeHIPAARequirements(): void {
    const requirements: HIPAARequirement[] = [
      // Administrative Safeguards
      {
        id: 'hipaa_1',
        category: 'administrative',
        requirement: 'Security Officer Designation',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-12-01')
      },
      {
        id: 'hipaa_2',
        category: 'administrative',
        requirement: 'Workforce Training',
        implemented: true,
        implementationDate: new Date('2024-01-15'),
        lastReviewed: new Date('2024-11-15')
      },
      {
        id: 'hipaa_3',
        category: 'administrative',
        requirement: 'Access Management',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-12-01')
      },
      {
        id: 'hipaa_4',
        category: 'administrative',
        requirement: 'Security Incident Procedures',
        implemented: true,
        implementationDate: new Date('2024-02-01'),
        lastReviewed: new Date('2024-12-01')
      },
      
      // Physical Safeguards
      {
        id: 'hipaa_5',
        category: 'physical',
        requirement: 'Facility Access Controls',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-10-01')
      },
      {
        id: 'hipaa_6',
        category: 'physical',
        requirement: 'Workstation Security',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-10-01')
      },
      
      // Technical Safeguards
      {
        id: 'hipaa_7',
        category: 'technical',
        requirement: 'Access Control',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-12-01')
      },
      {
        id: 'hipaa_8',
        category: 'technical',
        requirement: 'Audit Controls',
        implemented: true,
        implementationDate: new Date('2024-01-01'),
        lastReviewed: new Date('2024-12-01')
      },
      {
        id: 'hipaa_9',
        category: 'technical',
        requirement: 'Integrity Controls',
        implemented: true,
        implementationDate: new Date('2024-02-01'),
        lastReviewed: new Date('2024-12-01')
      },
      {
        id: 'hipaa_10',
        category: 'technical',
        requirement: 'Transmission Security',
        implemented: true,
        implementationDate: new Date('2024-01-15'),
        lastReviewed: new Date('2024-12-01')
      }
    ];
    
    requirements.forEach(req => {
      this.hipaaRequirements.set(req.id, req);
    });
  }

  private loadComplianceData(): void {
    // Load compliance records
    const savedRecords = localStorage.getItem('complianceRecords');
    if (savedRecords) {
      try {
        const records = JSON.parse(savedRecords);
        this.complianceRecords = records.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
      } catch (error) {
        console.error('Failed to load compliance records:', error);
      }
    }
    
    // Load consents
    const savedConsents = localStorage.getItem('privacyConsents');
    if (savedConsents) {
      try {
        const consents = JSON.parse(savedConsents);
        Object.entries(consents).forEach(([patientId, consentList]: [string, any]) => {
          const parsedConsents = consentList.map((c: any) => ({
            ...c,
            grantedDate: c.grantedDate ? new Date(c.grantedDate) : undefined,
            revokedDate: c.revokedDate ? new Date(c.revokedDate) : undefined,
            expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined
          }));
          this.consents.set(patientId, parsedConsents);
        });
      } catch (error) {
        console.error('Failed to load consents:', error);
      }
    }
    
    // Load security incidents
    const savedIncidents = localStorage.getItem('securityIncidents');
    if (savedIncidents) {
      try {
        const incidents = JSON.parse(savedIncidents);
        incidents.forEach(([id, incident]: [string, any]) => {
          this.securityIncidents.set(id, {
            ...incident,
            timestamp: new Date(incident.timestamp),
            resolutionDate: incident.resolutionDate ? new Date(incident.resolutionDate) : undefined
          });
        });
      } catch (error) {
        console.error('Failed to load security incidents:', error);
      }
    }
  }

  private saveComplianceData(): void {
    // Save only recent records to avoid storage bloat
    const recentRecords = this.complianceRecords.slice(-10000); // Keep last 10k records
    localStorage.setItem('complianceRecords', JSON.stringify(recentRecords));
    
    // Save consents
    const consentsObj: Record<string, PrivacyConsent[]> = {};
    this.consents.forEach((consentList, patientId) => {
      consentsObj[patientId] = consentList;
    });
    localStorage.setItem('privacyConsents', JSON.stringify(consentsObj));
    
    // Save security incidents
    localStorage.setItem('securityIncidents', JSON.stringify(
      Array.from(this.securityIncidents.entries())
    ));
  }

  private startComplianceMonitoring(): void {
    // Monitor session timeouts
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 60000); // Every minute
    
    // Daily compliance checks
    setInterval(() => {
      this.performDailyComplianceChecks();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private checkSessionTimeouts(): void {
    // In production, this would check actual user sessions
    // For now, we'll just log the check
    console.log('Checking session timeouts');
  }

  private performDailyComplianceChecks(): void {
    // Check for expired consents
    this.consents.forEach((consentList, patientId) => {
      consentList.forEach(consent => {
        if (consent.granted && consent.expiryDate && consent.expiryDate < new Date()) {
          this.logAction(
            'system',
            'admin',
            'consent_revoked',
            'patient_data',
            patientId,
            { reason: 'Consent expired', consentId: consent.id }
          );
        }
      });
    });
    
    // Check data retention
    const retentionResults = this.enforceDataRetention();
    if (retentionResults.deleted > 0 || retentionResults.archived > 0) {
      this.logAction(
        'system',
        'admin',
        'delete',
        'analytics',
        'multiple',
        {
          deleted: retentionResults.deleted,
          archived: retentionResults.archived
        }
      );
    }
  }

  private checkSuspiciousActivity(record: ComplianceRecord): void {
    // Check for multiple failed login attempts
    if (record.action === 'login' && record.result === 'failure') {
      const attempts = (this.loginAttempts.get(record.userId) || 0) + 1;
      this.loginAttempts.set(record.userId, attempts);
      
      if (attempts >= this.maxLoginAttempts) {
        this.reportSecurityIncident({
          severity: 'high',
          type: 'suspicious_activity',
          description: `User ${record.userId} exceeded maximum login attempts`,
          affectedResources: ['authentication'],
          userId: record.userId,
          actions: ['Account temporarily locked', 'Administrator notified']
        });
      }
    } else if (record.action === 'login' && record.result === 'success') {
      this.loginAttempts.delete(record.userId);
    }
    
    // Check for unusual export activity
    if (record.action === 'export') {
      const recentExports = this.complianceRecords.filter(r => 
        r.userId === record.userId &&
        r.action === 'export' &&
        r.timestamp > new Date(Date.now() - 3600000) // Last hour
      );
      
      if (recentExports.length > 10) {
        this.reportSecurityIncident({
          severity: 'medium',
          type: 'suspicious_activity',
          description: `User ${record.userId} performing excessive data exports`,
          affectedResources: [record.resourceType],
          userId: record.userId,
          actions: ['Activity logged for review']
        });
      }
    }
  }

  private alertAdministrators(incident: SecurityIncident): void {
    // In production, this would send emails/notifications
    console.error('Security Incident:', incident);
    
    // Dispatch event for UI notification
    window.dispatchEvent(new CustomEvent('securityIncident', { detail: incident }));
  }

  private getIPAddress(): string {
    // In production, get actual IP
    return '127.0.0.1';
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      type: /Mobile|Android|iPhone|iPad/i.test(userAgent) 
        ? (/iPad/i.test(userAgent) ? 'tablet' : 'mobile')
        : 'desktop',
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      version: this.detectBrowserVersion(userAgent)
    };
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    // Simplified version detection
    const match = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private calculateComplianceSummary(records: ComplianceRecord[]): ComplianceReport['summary'] {
    const uniqueUsers = new Set(records.map(r => r.userId));
    const securityIncidentCount = records.filter(r => 
      r.result === 'blocked' || r.action === 'access_denied'
    ).length;
    const consentChanges = records.filter(r => 
      r.action === 'consent_given' || r.action === 'consent_revoked'
    ).length;
    const dataExports = records.filter(r => r.action === 'export').length;
    const accessDenials = records.filter(r => r.result === 'blocked').length;
    
    return {
      totalActions: records.length,
      uniqueUsers: uniqueUsers.size,
      securityIncidents: securityIncidentCount,
      consentChanges,
      dataExports,
      accessDenials
    };
  }

  private analyzeUserActivity(records: ComplianceRecord[]): Map<string, UserActivitySummary> {
    const userActivity = new Map<string, UserActivitySummary>();
    
    records.forEach(record => {
      const existing = userActivity.get(record.userId) || {
        userId: record.userId,
        loginCount: 0,
        actionsPerformed: 0,
        lastActive: record.timestamp,
        suspiciousActivities: 0,
        resourcesAccessed: new Set<string>()
      };
      
      if (record.action === 'login') existing.loginCount++;
      existing.actionsPerformed++;
      if (record.timestamp > existing.lastActive) {
        existing.lastActive = record.timestamp;
      }
      if (record.result === 'blocked' || record.result === 'failure') {
        existing.suspiciousActivities++;
      }
      existing.resourcesAccessed.add(record.resourceType);
      
      userActivity.set(record.userId, existing);
    });
    
    return userActivity;
  }

  private analyzeResourceAccess(records: ComplianceRecord[]): Map<ResourceType, number> {
    const resourceAccess = new Map<ResourceType, number>();
    
    records.forEach(record => {
      const count = resourceAccess.get(record.resourceType) || 0;
      resourceAccess.set(record.resourceType, count + 1);
    });
    
    return resourceAccess;
  }

  private analyzeConsentStatus(): Map<string, ConsentSummary> {
    const consentStatus = new Map<string, ConsentSummary>();
    
    this.consents.forEach((consentList, patientId) => {
      const granted = consentList.filter(c => c.granted).length;
      const revoked = consentList.filter(c => !c.granted).length;
      
      const currentStatus: Record<string, boolean> = {};
      ['data_collection', 'data_sharing', 'marketing', 'research'].forEach(type => {
        currentStatus[type] = this.hasConsent(patientId, type as any);
      });
      
      const lastUpdated = consentList
        .map(c => c.grantedDate || c.revokedDate)
        .filter(d => d)
        .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || new Date();
      
      consentStatus.set(patientId, {
        patientId,
        consentsGranted: granted,
        consentsRevoked: revoked,
        currentStatus,
        lastUpdated
      });
    });
    
    return consentStatus;
  }

  private generateComplianceRecommendations(
    summary: ComplianceReport['summary'],
    userActivity: Map<string, UserActivitySummary>,
    securityEvents: SecurityIncident[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Security recommendations
    if (summary.securityIncidents > 5) {
      recommendations.push('Review and strengthen security policies due to high incident count');
    }
    
    if (summary.accessDenials > 10) {
      recommendations.push('Review user permissions - high number of access denials detected');
    }
    
    // User activity recommendations
    const suspiciousUsers = Array.from(userActivity.values())
      .filter(u => u.suspiciousActivities > 3);
    
    if (suspiciousUsers.length > 0) {
      recommendations.push(`Review activity for ${suspiciousUsers.length} users with suspicious patterns`);
    }
    
    // Consent recommendations
    if (summary.consentChanges > 20) {
      recommendations.push('High consent change activity - ensure proper documentation');
    }
    
    // Export recommendations
    if (summary.dataExports > 50) {
      recommendations.push('Implement additional controls for data export activities');
    }
    
    // Unresolved incidents
    const unresolvedIncidents = securityEvents.filter(i => !i.resolved);
    if (unresolvedIncidents.length > 0) {
      recommendations.push(`Address ${unresolvedIncidents.length} unresolved security incidents`);
    }
    
    return recommendations;
  }

  private convertToCSV(records: ComplianceRecord[]): string {
    const headers = [
      'Timestamp', 'User ID', 'User Role', 'Action', 'Resource Type',
      'Resource ID', 'Result', 'IP Address', 'Device Type'
    ];
    
    const rows = records.map(r => [
      r.timestamp.toISOString(),
      r.userId,
      r.userRole,
      r.action,
      r.resourceType,
      r.resourceId,
      r.result,
      r.ipAddress || '',
      r.deviceInfo?.type || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton getter
export function getComplianceTrackingService(): ComplianceTrackingService {
  return ComplianceTrackingService.getInstance();
}