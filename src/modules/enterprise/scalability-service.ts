/**
 * Scalability Service v2 - Exact Mirror of Original MonitoringSystem.js
 * Comprehensive monitoring and performance tracking system
 * Mirrors complete healthcare monitoring functionality from original
 */

import { EventEmitter } from 'events';

interface ScalabilityMetrics {
  performance: PerformanceMetric[];
  errors: ErrorMetric[];
  usage: UsageMetric[];
  custom: CustomMetric[];
  health: HealthCheckResult | null;
}

interface PerformanceMetric {
  name: string;
  type: string;
  duration: number;
  timestamp: number;
  entryType?: string;
  startTime?: number;
  responseEnd?: number;
  transferSize?: number;
}

interface ErrorMetric {
  id: string;
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
  userAgent: string;
  type?: 'error' | 'unhandledRejection';
  reason?: any;
  promise?: Promise<any>;
  userId?: string;
  sessionId?: string;
}

interface UsageMetric {
  category: string;
  action: string;
  label?: string;
  value?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
  title?: string;
}

interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

interface HealthCheckResult {
  timestamp: number;
  checks: {
    api: ServiceHealthStatus;
    database: ServiceHealthStatus;
    storage: ServiceHealthStatus;
    memory: ServiceHealthStatus;
    cpu: ServiceHealthStatus;
  };
}

interface ServiceHealthStatus {
  healthy: boolean;
  responseTime?: number;
  connections?: number;
  message: string;
  usage?: number;
  total?: number;
  quota?: number;
  percentUsed?: number;
  used?: number;
  limit?: number;
  executionTime?: number;
}

interface AlertRecord {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type?: string;
  service?: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  metric?: PerformanceMetric;
  error?: ErrorMetric;
  resolvedAt?: number;
  resolvedBy?: string;
}

interface MetricsReport {
  timestamp: number;
  performance: PerformanceReport;
  usage: UsageReport;
  alerts: AlertsReport;
  health: HealthReport;
}

interface PerformanceReport {
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface UsageReport {
  activeUsers: number;
  totalEvents: number;
  topEvents: EventCount[];
}

interface AlertsReport {
  total: number;
  critical: number;
  unresolved: number;
}

interface HealthReport {
  uptime: number;
  servicesHealthy: number;
  servicesTotal: number;
}

interface EventCount {
  event: string;
  count: number;
}

class ScalabilityService extends EventEmitter {
  private static instance: ScalabilityService;
  private metrics: ScalabilityMetrics;
  private alerts: AlertRecord[] = [];
  private sessionId: string;
  private dashboardUrl = '/admin/monitoring';
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.initializeMetrics();
  }

  static getInstance(): ScalabilityService {
    if (!ScalabilityService.instance) {
      ScalabilityService.instance = new ScalabilityService();
    }
    return ScalabilityService.instance;
  }

  private initializeMetrics(): void {
    this.metrics = {
      performance: [],
      errors: [],
      usage: [],
      custom: [],
      health: null
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Initialize Monitoring - Exact Mirror of Original
  initializeMonitoring(): void {
    if (this.isInitialized) return;

    this.setupPerformanceObserver();
    this.setupErrorTracking();
    this.setupUsageTracking();
    this.startHealthChecks();

    this.isInitialized = true;
    console.log('📊 Scalability monitoring initialized');
  }

  // Performance Observer - Exact Mirror
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordPerformanceMetric({
              name: entry.name,
              type: entry.entryType,
              duration: entry.duration,
              timestamp: Date.now(),
              startTime: entry.startTime,
              // Add additional properties based on entry type
              ...(entry.entryType === 'navigation' && {
                responseEnd: (entry as PerformanceNavigationTiming).responseEnd,
                transferSize: (entry as PerformanceNavigationTiming).transferSize
              })
            });
          });
        });

        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'mark'] 
        });

        console.log('📈 Performance observer initialized');
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    } else {
      console.warn('PerformanceObserver not supported');
    }
  }

  // Error Tracking - Exact Mirror
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        id: this.generateErrorId(),
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        type: 'error',
        userId: this.getCurrentUserId(),
        sessionId: this.sessionId
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        id: this.generateErrorId(),
        message: 'Unhandled Promise Rejection',
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        type: 'unhandledRejection',
        reason: event.reason,
        promise: event.promise,
        userId: this.getCurrentUserId(),
        sessionId: this.sessionId
      });
    });

    console.log('🚨 Error tracking initialized');
  }

  // Usage Tracking - Exact Mirror
  private setupUsageTracking(): void {
    // Track page views
    this.trackPageView();

    // Track user interactions
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const trackableElement = target.closest('[data-track]') as HTMLElement;
      
      if (trackableElement) {
        this.trackEvent({
          category: 'interaction',
          action: 'click',
          label: trackableElement.dataset.track || 'unknown',
          value: trackableElement.dataset.trackValue,
          timestamp: Date.now(),
          userId: this.getCurrentUserId(),
          sessionId: this.sessionId
        });
      }
    });

    // Track session duration
    const sessionStart = Date.now();
    window.addEventListener('beforeunload', () => {
      this.trackEvent({
        category: 'session',
        action: 'end',
        value: Date.now() - sessionStart,
        timestamp: Date.now(),
        userId: this.getCurrentUserId(),
        sessionId: this.sessionId
      });
    });

    console.log('📊 Usage tracking initialized');
  }

  // Health Checks - Exact Mirror
  private startHealthChecks(): void {
    // Initial health check
    this.performHealthCheck();

    // Periodic health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('🏥 Health checks started (5 minute intervals)');
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      api: await this.checkAPI(),
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      memory: this.checkMemory(),
      cpu: await this.checkCPU()
    };

    const health: HealthCheckResult = {
      timestamp: Date.now(),
      checks
    };

    // Check for failures and create alerts
    Object.entries(checks).forEach(([service, status]) => {
      if (!status.healthy) {
        this.createAlert({
          severity: 'critical',
          service,
          message: status.message,
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    this.metrics.health = health;
    this.emit('healthCheckCompleted', health);

    return health;
  }

  // Individual Health Checks - Exact Mirror
  private async checkAPI(): Promise<ServiceHealthStatus> {
    try {
      const start = Date.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const responseTime = Date.now() - start;

      return {
        healthy: response.ok,
        responseTime,
        message: response.ok ? 'API is healthy' : `API returned ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `API error: ${(error as Error).message}`
      };
    }
  }

  private async checkDatabase(): Promise<ServiceHealthStatus> {
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      
      return {
        healthy: data.status === 'ok',
        connections: data.connections,
        message: data.message || 'Database check completed'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database error: ${(error as Error).message}`
      };
    }
  }

  private async checkStorage(): Promise<ServiceHealthStatus> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const percentUsed = estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0;

        return {
          healthy: percentUsed < 90,
          usage: estimate.usage,
          total: estimate.quota,
          percentUsed,
          message: percentUsed < 90 ? 'Storage healthy' : 'Storage nearly full'
        };
      } catch (error) {
        return {
          healthy: false,
          message: 'Storage check failed'
        };
      }
    }

    return {
      healthy: true,
      message: 'Storage API not available'
    };
  }

  private checkMemory(): ServiceHealthStatus {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      const percentUsed = (used / limit) * 100;

      return {
        healthy: percentUsed < 90,
        used,
        total,
        limit,
        percentUsed,
        message: percentUsed < 90 ? 'Memory usage normal' : 'High memory usage detected'
      };
    }

    return {
      healthy: true,
      message: 'Memory API not available'
    };
  }

  private async checkCPU(): Promise<ServiceHealthStatus> {
    // Estimate CPU usage by measuring task execution time
    const start = performance.now();
    let sum = 0;
    
    // CPU-intensive task
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }
    
    const executionTime = performance.now() - start;

    return {
      healthy: executionTime < 100,
      executionTime,
      message: executionTime < 100 ? 'CPU performance normal' : 'High CPU usage detected'
    };
  }

  // Metric Recording - Exact Mirror
  recordPerformanceMetric(metric: PerformanceMetric): void {
    this.metrics.performance.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.performance.length > 1000) {
      this.metrics.performance.shift();
    }

    // Check for performance issues
    if (metric.duration > 3000) {
      this.createAlert({
        severity: 'warning',
        type: 'performance',
        message: `Slow ${metric.type}: ${metric.name} took ${Math.round(metric.duration)}ms`,
        timestamp: Date.now(),
        resolved: false,
        metric
      });
    }

    this.emit('performanceMetric', metric);
  }

  recordError(error: ErrorMetric): void {
    this.metrics.errors.push(error);

    // Keep only last 1000 errors
    if (this.metrics.errors.length > 1000) {
      this.metrics.errors.shift();
    }

    // Send to error tracking service
    this.sendToErrorTracking(error);

    // Create alert for critical errors
    if (error.source?.includes('critical') || error.message?.includes('FATAL')) {
      this.createAlert({
        severity: 'critical',
        type: 'error',
        message: `Critical error: ${error.message}`,
        timestamp: Date.now(),
        resolved: false,
        error
      });
    }

    this.emit('errorRecorded', error);
  }

  recordCustomMetric(metric: CustomMetric): void {
    this.metrics.custom.push(metric);

    // Keep only last 1000 custom metrics
    if (this.metrics.custom.length > 1000) {
      this.metrics.custom.shift();
    }

    this.emit('customMetric', metric);
  }

  trackEvent(event: UsageMetric): void {
    this.metrics.usage.push(event);

    // Keep only last 5000 usage events
    if (this.metrics.usage.length > 5000) {
      this.metrics.usage.shift();
    }

    // Send to analytics service
    this.sendToAnalytics(event);

    this.emit('eventTracked', event);
  }

  trackPageView(): void {
    this.trackEvent({
      category: 'navigation',
      action: 'pageview',
      label: window.location.pathname,
      title: document.title,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId
    });
  }

  // Alert Management - Exact Mirror
  private createAlert(alert: Omit<AlertRecord, 'id'>): void {
    const newAlert: AlertRecord = {
      ...alert,
      id: this.generateAlertId()
    };

    this.alerts.push(newAlert);

    // Show critical alerts in UI
    if (alert.severity === 'critical') {
      this.showCriticalAlert(newAlert);
    }

    // Send notifications
    this.sendAlertNotifications(newAlert);

    this.emit('alertCreated', newAlert);
  }

  private showCriticalAlert(alert: AlertRecord): void {
    // Create visual alert in browser
    const container = document.createElement('div');
    container.className = 'critical-alert';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 400px;
      z-index: 10000;
      animation: alertSlideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    container.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
        <strong>Critical System Alert</strong>
      </div>
      <div style="font-size: 14px; line-height: 1.4;">
        ${alert.message || 'System error detected'}
      </div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
        Service: ${alert.service || 'Unknown'}<br>
        Time: ${new Date(alert.timestamp).toLocaleTimeString()}
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes alertSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(container);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (container.parentNode) {
        container.remove();
      }
    }, 10000);
  }

  private async sendAlertNotifications(alert: AlertRecord): Promise<void> {
    try {
      // Send to monitoring service
      await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(alert)
      });

      // Send critical alerts via multiple channels
      if (alert.severity === 'critical') {
        await fetch('/api/notifications/critical', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'system_alert',
            alert,
            recipients: ['admin@tinkybink.com', 'ops@tinkybink.com']
          })
        });
      }
    } catch (error) {
      console.error('Failed to send alert notifications:', error);
    }
  }

  // Analytics Integration - Exact Mirror
  private async sendToErrorTracking(error: ErrorMetric): Promise<void> {
    // Send to Sentry/Rollbar/etc
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(error.message), {
        extra: error,
        tags: {
          sessionId: error.sessionId,
          userId: error.userId
        }
      });
    }

    // Also send to custom error tracking endpoint
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.warn('Failed to send error to tracking service:', err);
    }
  }

  private async sendToAnalytics(event: UsageMetric): Promise<void> {
    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter_user_id: event.userId,
        custom_parameter_session_id: event.sessionId
      });
    }

    // Send to Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(`${event.category}_${event.action}`, {
        label: event.label,
        value: event.value,
        userId: event.userId,
        sessionId: event.sessionId
      });
    }

    // Send to custom analytics endpoint
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Metrics Reporting - Exact Mirror
  generateMetricsReport(): MetricsReport {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    return {
      timestamp: now,
      performance: {
        avgResponseTime: this.calculateAvgResponseTime(hourAgo),
        p95ResponseTime: this.calculate95thPercentile(hourAgo),
        errorRate: this.calculateErrorRate(hourAgo),
        uptime: this.calculateUptime()
      },
      usage: {
        activeUsers: this.countActiveUsers(hourAgo),
        totalEvents: this.metrics.usage.filter(e => e.timestamp > hourAgo).length,
        topEvents: this.getTopEvents(hourAgo)
      },
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        unresolved: this.alerts.filter(a => !a.resolved).length
      },
      health: {
        uptime: this.calculateUptime(),
        servicesHealthy: this.getHealthyServicesCount(),
        servicesTotal: this.getTotalServicesCount()
      }
    };
  }

  private calculateAvgResponseTime(since: number): number {
    const recent = this.metrics.performance.filter(m => 
      m.timestamp > since && m.type === 'resource'
    );

    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / recent.length);
  }

  private calculate95thPercentile(since: number): number {
    const durations = this.metrics.performance
      .filter(m => m.timestamp > since && m.type === 'resource')
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (durations.length === 0) return 0;

    const index = Math.floor(durations.length * 0.95);
    return Math.round(durations[index] || 0);
  }

  private calculateErrorRate(since: number): number {
    const totalRequests = this.metrics.performance.filter(m => 
      m.timestamp > since && m.type === 'resource'
    ).length;

    const errors = this.metrics.errors.filter(e => e.timestamp > since).length;

    return totalRequests > 0 ? Math.round((errors / totalRequests) * 100 * 10) / 10 : 0;
  }

  private calculateUptime(): number {
    if (!this.metrics.health?.checks) return 100;

    const checks = this.metrics.health.checks;
    const healthyServices = Object.values(checks).filter(c => c.healthy).length;
    const totalServices = Object.keys(checks).length;

    return totalServices > 0 ? Math.round((healthyServices / totalServices) * 100 * 10) / 10 : 100;
  }

  private countActiveUsers(since: number): number {
    const userIds = new Set(
      this.metrics.usage
        .filter(e => e.timestamp > since && e.userId)
        .map(e => e.userId)
    );

    return userIds.size;
  }

  private getTopEvents(since: number): EventCount[] {
    const eventCounts: Record<string, number> = {};

    this.metrics.usage
      .filter(e => e.timestamp > since)
      .forEach(e => {
        const key = `${e.category}:${e.action}`;
        eventCounts[key] = (eventCounts[key] || 0) + 1;
      });

    return Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));
  }

  private getHealthyServicesCount(): number {
    if (!this.metrics.health?.checks) return 0;
    return Object.values(this.metrics.health.checks).filter(c => c.healthy).length;
  }

  private getTotalServicesCount(): number {
    if (!this.metrics.health?.checks) return 0;
    return Object.keys(this.metrics.health.checks).length;
  }

  // Export Functions - Exact Mirror
  exportMetrics(format: 'json' | 'csv' | 'prometheus' = 'json'): void {
    const data = {
      metrics: this.metrics,
      alerts: this.alerts,
      report: this.generateMetricsReport(),
      exportedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        this.downloadJSON(data);
        break;
      case 'csv':
        this.downloadCSV(data);
        break;
      case 'prometheus':
        this.downloadPrometheus(data);
        break;
    }
  }

  private downloadJSON(data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    this.downloadBlob(blob, `scalability-metrics-${new Date().toISOString()}.json`);
  }

  private downloadCSV(data: any): void {
    const csv = this.convertToCSV(data.metrics.usage);
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadBlob(blob, `scalability-metrics-${new Date().toISOString()}.csv`);
  }

  private downloadPrometheus(data: any): void {
    const prometheus = this.formatPrometheus(data);
    const blob = new Blob([prometheus], { type: 'text/plain' });
    this.downloadBlob(blob, `scalability-metrics-${new Date().toISOString()}.prom`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private formatPrometheus(data: any): string {
    const metrics = [];

    // Response time metrics
    metrics.push('# HELP http_request_duration_seconds HTTP request latency');
    metrics.push('# TYPE http_request_duration_seconds histogram');
    metrics.push(`http_request_duration_seconds_sum ${data.report.performance.avgResponseTime / 1000}`);

    // Error rate
    metrics.push('# HELP http_requests_errors_total Total HTTP errors');
    metrics.push('# TYPE http_requests_errors_total counter');
    metrics.push(`http_requests_errors_total ${data.metrics.errors.length}`);

    // Active users
    metrics.push('# HELP active_users_total Current active users');
    metrics.push('# TYPE active_users_total gauge');
    metrics.push(`active_users_total ${data.report.usage.activeUsers}`);

    // System uptime
    metrics.push('# HELP system_uptime_percent System uptime percentage');
    metrics.push('# TYPE system_uptime_percent gauge');
    metrics.push(`system_uptime_percent ${data.report.performance.uptime}`);

    return metrics.join('\n');
  }

  // Utility Methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Get from auth system if available
    return (window as any).authSystem?.getCurrentUser()?.id;
  }

  private getAuthToken(): string | null {
    return (window as any).authSystem?.getToken() || null;
  }

  // Public API Methods
  getMetrics(): ScalabilityMetrics {
    return { ...this.metrics };
  }

  getAlerts(): AlertRecord[] {
    return [...this.alerts];
  }

  getReport(): MetricsReport {
    return this.generateMetricsReport();
  }

  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  clearOldData(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);

    this.metrics.performance = this.metrics.performance.filter(m => m.timestamp > cutoff);
    this.metrics.errors = this.metrics.errors.filter(e => e.timestamp > cutoff);
    this.metrics.usage = this.metrics.usage.filter(u => u.timestamp > cutoff);
    this.metrics.custom = this.metrics.custom.filter(c => c.timestamp > cutoff);

    this.alerts = this.alerts.filter(a => a.timestamp > cutoff || !a.resolved);

    this.emit('dataCleared', { cutoff, olderThanHours });
  }

  // Initialize method for module system
  initialize(): void {
    if (this.isInitialized) return;

    this.initializeMonitoring();
    
    console.log('🔄 Scalability Service v2 initialized - Complete Monitoring System');
    this.emit('initialized');
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('🔄 Scalability Service destroyed');
  }
}

// Export singleton instance
export function getScalabilityService(): ScalabilityService {
  return ScalabilityService.getInstance();
}

export default ScalabilityService;