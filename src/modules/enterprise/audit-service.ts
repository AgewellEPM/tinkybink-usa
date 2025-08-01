/**
 * Audit Service
 * Module 46: Comprehensive audit trail and activity logging
 */

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'success' | 'failure';
  errorDetails?: string;
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'auth_failure'
  | 'export' | 'import' | 'share'
  | 'speak' | 'record' | 'play'
  | 'board_change' | 'tile_select'
  | 'settings_change' | 'permission_change'
  | 'therapy_goal_update' | 'assessment_complete'
  | 'billing_action' | 'prescription_action'
  | 'data_access' | 'data_modification';

type ResourceType = 
  | 'user' | 'board' | 'tile' | 'session'
  | 'patient' | 'goal' | 'assessment'
  | 'billing' | 'prescription' | 'report'
  | 'settings' | 'system';

interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction | AuditAction[];
  resourceType?: ResourceType | ResourceType[];
  result?: 'success' | 'failure';
  searchTerm?: string;
}

interface AuditReport {
  id: string;
  name: string;
  description: string;
  filters: AuditFilter;
  format: 'json' | 'csv' | 'pdf';
  schedule?: ReportSchedule;
  recipients?: string[];
  lastGenerated?: string;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}

interface AuditStatistics {
  totalEvents: number;
  eventsByAction: Map<AuditAction, number>;
  eventsByResource: Map<ResourceType, number>;
  eventsByUser: Map<string, number>;
  failureRate: number;
  peakActivityTimes: { hour: number; count: number }[];
}

export class AuditService {
  private static instance: AuditService;
  private auditEvents: AuditEvent[] = [];
  private reports: Map<string, AuditReport> = new Map();
  private retentionDays = 365; // Default 1 year retention
  private maxEventsInMemory = 10000;
  private isEnabled = true;
  private auditQueue: AuditEvent[] = [];
  private isProcessing = false;

  private constructor() {
    this.setupPeriodicTasks();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  initialize(): void {
    console.log('📋 Audit Service ready - Comprehensive activity logging');
    this.loadAuditEvents();
    this.loadReports();
    this.cleanupOldEvents();
  }

  /**
   * Log an audit event
   */
  log(
    action: AuditAction,
    resourceType: ResourceType,
    details: Partial<AuditEvent> = {}
  ): string {
    if (!this.isEnabled) return '';

    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();

    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || details.userId || 'anonymous',
      userName: currentUser?.name || details.userName,
      action,
      resourceType,
      resourceId: details.resourceId,
      resourceName: details.resourceName,
      changes: details.changes,
      metadata: details.metadata,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      result: details.result || 'success',
      errorDetails: details.errorDetails
    };

    // Add to queue for batch processing
    this.auditQueue.push(event);
    this.processQueue();

    return event.id;
  }

  /**
   * Log a failed action
   */
  logFailure(
    action: AuditAction,
    resourceType: ResourceType,
    error: string,
    details: Partial<AuditEvent> = {}
  ): string {
    return this.log(action, resourceType, {
      ...details,
      result: 'failure',
      errorDetails: error
    });
  }

  /**
   * Query audit events
   */
  query(filters: AuditFilter, limit = 100, offset = 0): AuditEvent[] {
    let filtered = [...this.auditEvents];

    // Apply filters
    if (filters.startDate) {
      filtered = filtered.filter(e => 
        new Date(e.timestamp) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => 
        new Date(e.timestamp) <= filters.endDate!
      );
    }

    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters.action) {
      const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
      filtered = filtered.filter(e => actions.includes(e.action));
    }

    if (filters.resourceType) {
      const types = Array.isArray(filters.resourceType) ? filters.resourceType : [filters.resourceType];
      filtered = filtered.filter(e => types.includes(e.resourceType));
    }

    if (filters.result) {
      filtered = filtered.filter(e => e.result === filters.result);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.resourceName?.toLowerCase().includes(term) ||
        e.userName?.toLowerCase().includes(term) ||
        JSON.stringify(e.metadata).toLowerCase().includes(term)
      );
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get audit statistics
   */
  getStatistics(filters?: AuditFilter): AuditStatistics {
    const events = filters ? this.query(filters, Number.MAX_SAFE_INTEGER) : this.auditEvents;

    const stats: AuditStatistics = {
      totalEvents: events.length,
      eventsByAction: new Map(),
      eventsByResource: new Map(),
      eventsByUser: new Map(),
      failureRate: 0,
      peakActivityTimes: []
    };

    // Calculate statistics
    let failures = 0;
    const hourCounts = new Map<number, number>();

    events.forEach(event => {
      // By action
      stats.eventsByAction.set(
        event.action,
        (stats.eventsByAction.get(event.action) || 0) + 1
      );

      // By resource
      stats.eventsByResource.set(
        event.resourceType,
        (stats.eventsByResource.get(event.resourceType) || 0) + 1
      );

      // By user
      stats.eventsByUser.set(
        event.userId,
        (stats.eventsByUser.get(event.userId) || 0) + 1
      );

      // Failures
      if (event.result === 'failure') failures++;

      // Peak times
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Calculate failure rate
    stats.failureRate = events.length > 0 ? failures / events.length : 0;

    // Calculate peak activity times
    stats.peakActivityTimes = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  }

  /**
   * Create audit report
   */
  createReport(
    name: string,
    description: string,
    filters: AuditFilter,
    format: AuditReport['format'] = 'json'
  ): string {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: AuditReport = {
      id: reportId,
      name,
      description,
      filters,
      format
    };

    this.reports.set(reportId, report);
    this.saveReports();

    return reportId;
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string): Promise<string | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const events = this.query(report.filters, Number.MAX_SAFE_INTEGER);
    
    switch (report.format) {
      case 'json':
        return this.generateJSONReport(events, report);
      case 'csv':
        return this.generateCSVReport(events, report);
      case 'pdf':
        return this.generatePDFReport(events, report);
      default:
        return null;
    }
  }

  /**
   * Schedule report
   */
  scheduleReport(
    reportId: string,
    schedule: ReportSchedule,
    recipients: string[]
  ): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.schedule = schedule;
    report.recipients = recipients;
    
    this.saveReports();
    this.setupReportSchedule(report);

    return true;
  }

  /**
   * Export audit logs
   */
  async exportLogs(
    filters: AuditFilter,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    const events = this.query(filters, Number.MAX_SAFE_INTEGER);
    
    if (format === 'json') {
      const json = JSON.stringify(events, null, 2);
      return new Blob([json], { type: 'application/json' });
    } else {
      const csv = this.eventsToCSV(events);
      return new Blob([csv], { type: 'text/csv' });
    }
  }

  /**
   * Set retention period
   */
  setRetentionDays(days: number): void {
    this.retentionDays = days;
    this.cleanupOldEvents();
  }

  /**
   * Enable/disable auditing
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      console.log('📋 Audit logging enabled');
    } else {
      console.log('📋 Audit logging disabled');
      // Flush any pending events
      this.flushQueue();
    }
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(
    userId: string,
    days = 30
  ): {
    totalActions: number;
    actionsByType: Map<AuditAction, number>;
    resourcesAccessed: Set<string>;
    failureCount: number;
    lastActivity: string | null;
  } {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userEvents = this.query({ userId, startDate });

    const summary = {
      totalActions: userEvents.length,
      actionsByType: new Map<AuditAction, number>(),
      resourcesAccessed: new Set<string>(),
      failureCount: 0,
      lastActivity: userEvents[0]?.timestamp || null
    };

    userEvents.forEach(event => {
      // Actions by type
      summary.actionsByType.set(
        event.action,
        (summary.actionsByType.get(event.action) || 0) + 1
      );

      // Resources accessed
      if (event.resourceId) {
        summary.resourcesAccessed.add(`${event.resourceType}:${event.resourceId}`);
      }

      // Failures
      if (event.result === 'failure') {
        summary.failureCount++;
      }
    });

    return summary;
  }

  /**
   * Check for suspicious activity
   */
  detectSuspiciousActivity(): {
    userId: string;
    reason: string;
    events: AuditEvent[];
  }[] {
    const suspicious: any[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Group events by user
    const userEvents = new Map<string, AuditEvent[]>();
    
    this.auditEvents
      .filter(e => new Date(e.timestamp) > oneHourAgo)
      .forEach(event => {
        const events = userEvents.get(event.userId) || [];
        events.push(event);
        userEvents.set(event.userId, events);
      });

    // Check for suspicious patterns
    userEvents.forEach((events, userId) => {
      // Too many failed attempts
      const failures = events.filter(e => e.result === 'failure');
      if (failures.length > 5) {
        suspicious.push({
          userId,
          reason: `${failures.length} failed attempts in the last hour`,
          events: failures
        });
      }

      // Rapid data exports
      const exports = events.filter(e => e.action === 'export');
      if (exports.length > 10) {
        suspicious.push({
          userId,
          reason: `${exports.length} data exports in the last hour`,
          events: exports
        });
      }

      // Unusual access patterns
      const uniqueResources = new Set(
        events.filter(e => e.resourceId).map(e => `${e.resourceType}:${e.resourceId}`)
      );
      if (uniqueResources.size > 50) {
        suspicious.push({
          userId,
          reason: `Accessed ${uniqueResources.size} different resources in the last hour`,
          events: events.slice(0, 10)
        });
      }
    });

    return suspicious;
  }

  // Private helper methods
  private processQueue(): void {
    if (this.isProcessing || this.auditQueue.length === 0) return;

    this.isProcessing = true;

    // Process up to 100 events at a time
    const batch = this.auditQueue.splice(0, 100);
    
    batch.forEach(event => {
      this.auditEvents.push(event);
      
      // Trigger real-time alerts for critical events
      if (event.action === 'auth_failure' || event.result === 'failure') {
        this.checkAlertConditions(event);
      }
    });

    // Maintain memory limit
    if (this.auditEvents.length > this.maxEventsInMemory) {
      const toArchive = this.auditEvents.splice(
        0, 
        this.auditEvents.length - this.maxEventsInMemory
      );
      this.archiveEvents(toArchive);
    }

    // Save to storage
    this.saveAuditEvents();

    this.isProcessing = false;

    // Process remaining events
    if (this.auditQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private flushQueue(): void {
    if (this.auditQueue.length === 0) return;

    const remainingEvents = [...this.auditQueue];
    this.auditQueue = [];
    
    remainingEvents.forEach(event => {
      this.auditEvents.push(event);
    });

    this.saveAuditEvents();
  }

  private checkAlertConditions(event: AuditEvent): void {
    // Check for multiple auth failures
    const recentAuthFailures = this.auditEvents
      .filter(e => 
        e.userId === event.userId &&
        e.action === 'auth_failure' &&
        new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      );

    if (recentAuthFailures.length >= 3) {
      console.warn(`🚨 Multiple auth failures for user ${event.userId}`);
      // In production, send alert notification
    }
  }

  private cleanupOldEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const before = this.auditEvents.length;
    this.auditEvents = this.auditEvents.filter(event => 
      new Date(event.timestamp) > cutoffDate
    );

    const removed = before - this.auditEvents.length;
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old audit events`);
      this.saveAuditEvents();
    }
  }

  private archiveEvents(events: AuditEvent[]): void {
    // In production, send to long-term storage
    console.log(`📦 Archiving ${events.length} audit events`);
  }

  private generateJSONReport(events: AuditEvent[], report: AuditReport): string {
    const reportData = {
      report: {
        id: report.id,
        name: report.name,
        description: report.description,
        generated: new Date().toISOString(),
        filters: report.filters,
        eventCount: events.length
      },
      statistics: this.getStatistics(report.filters),
      events
    };

    return JSON.stringify(reportData, null, 2);
  }

  private generateCSVReport(events: AuditEvent[], report: AuditReport): string {
    const header = 'Timestamp,User ID,User Name,Action,Resource Type,Resource ID,Resource Name,Result,Error Details\n';
    
    const rows = events.map(event => 
      [
        event.timestamp,
        event.userId,
        event.userName || '',
        event.action,
        event.resourceType,
        event.resourceId || '',
        event.resourceName || '',
        event.result,
        event.errorDetails || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return header + rows;
  }

  private generatePDFReport(events: AuditEvent[], report: AuditReport): string {
    // In production, use a PDF library
    console.log('PDF generation not implemented');
    return this.generateJSONReport(events, report);
  }

  private eventsToCSV(events: AuditEvent[]): string {
    return this.generateCSVReport(events, {} as AuditReport);
  }

  private setupReportSchedule(report: AuditReport): void {
    if (!report.schedule) return;

    // In production, use a proper scheduler
    console.log(`📅 Scheduled report: ${report.name}`);
  }

  private setupPeriodicTasks(): void {
    // Cleanup old events daily
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000);

    // Check for suspicious activity every hour
    setInterval(() => {
      const suspicious = this.detectSuspiciousActivity();
      if (suspicious.length > 0) {
        console.warn('🚨 Suspicious activity detected:', suspicious);
      }
    }, 60 * 60 * 1000);
  }

  private getClientIP(): string {
    // In production, get from server
    return 'unknown';
  }

  private getSessionId(): string {
    // Get from session tracking service
    const sessionTracking = (window as any).moduleSystem?.get('SessionTrackingService');
    return sessionTracking?.getCurrentSession()?.id || 'unknown';
  }

  private loadAuditEvents(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('audit_events');
      if (saved) {
        this.auditEvents = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load audit events:', error);
    }
  }

  private saveAuditEvents(): void {
    if (typeof window === 'undefined') return;

    try {
      // Only save recent events to avoid storage limits
      const recentEvents = this.auditEvents.slice(-this.maxEventsInMemory);
      localStorage.setItem('audit_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to save audit events:', error);
    }
  }

  private loadReports(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('audit_reports');
      if (saved) {
        const reports = JSON.parse(saved);
        reports.forEach((report: AuditReport) => {
          this.reports.set(report.id, report);
        });
      }
    } catch (error) {
      console.error('Failed to load audit reports:', error);
    }
  }

  private saveReports(): void {
    if (typeof window === 'undefined') return;

    try {
      const reports = Array.from(this.reports.values());
      localStorage.setItem('audit_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save audit reports:', error);
    }
  }
}

// Export singleton getter function
export function getAuditService(): AuditService {
  return AuditService.getInstance();
}