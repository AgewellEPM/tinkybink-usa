// Enterprise Dashboard Service - Module 58
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getMultiTenantService } from './multi-tenant-service';
import { getRBACService } from './rbac-service';
import { getAuditService } from './audit-service';

interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'progress' | 'heatmap' | 'gauge';
  title: string;
  description?: string;
  position: { x: number; y: number; w: number; h: number };
  dataSource: string;
  config: WidgetConfig;
  refreshInterval?: number;
  permissions: string[];
  isVisible: boolean;
  lastUpdated?: Date;
}

interface WidgetConfig {
  // Chart configs
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year';
  
  // Metric configs
  metric?: string;
  unit?: string;
  target?: number;
  threshold?: { warning: number; critical: number };
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  
  // Table configs
  columns?: Array<{ key: string; label: string; type: string; width?: number }>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  
  // Alert configs
  severity?: 'info' | 'warning' | 'error' | 'success';
  autoClose?: boolean;
  
  // Common configs
  color?: string;
  gradient?: boolean;
  animated?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  type: 'executive' | 'operational' | 'analytics' | 'compliance' | 'custom';
  tenantId: string;
  ownerId: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  settings: DashboardSettings;
  permissions: DashboardPermissions;
  createdAt: Date;
  updatedAt: Date;
  isShared: boolean;
  tags: string[];
}

interface DashboardLayout {
  cols: number;
  rows: number;
  margin: [number, number];  // [x, y]
  containerPadding: [number, number];  // [x, y]
  rowHeight: number;
  isDraggable: boolean;
  isResizable: boolean;
  preventCollision: boolean;
}

interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showGrid: boolean;
  snapToGrid: boolean;
  animations: boolean;
  notifications: boolean;
  exportEnabled: boolean;
  printEnabled: boolean;
}

interface DashboardPermissions {
  view: string[];      // User IDs or role names
  edit: string[];      // User IDs or role names
  admin: string[];     // User IDs or role names
  export: string[];    // User IDs or role names
  share: string[];     // User IDs or role names
}

interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  unit?: string;
  target?: number;
  lastUpdated: Date;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
  options: Record<string, unknown>;
}

interface AlertData {
  id: string;
  type: 'system' | 'compliance' | 'performance' | 'security' | 'usage';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actions?: Array<{ label: string; action: string }>;
}

interface DashboardExport {
  format: 'pdf' | 'png' | 'svg' | 'excel' | 'csv' | 'json';
  widgets: string[];  // Widget IDs to include
  timeRange?: { start: Date; end: Date };
  includeMeta: boolean;
  theme: 'light' | 'dark';
}

export class EnterpriseDashboardService {
  private static instance: EnterpriseDashboardService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private multiTenantService = getMultiTenantService();
  private rbacService = getRBACService();
  private auditService = getAuditService();
  
  private dashboards: Map<string, Dashboard> = new Map();
  private widgetData: Map<string, unknown> = new Map();
  private alerts: Map<string, AlertData> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private metricProviders: Map<string, () => Promise<MetricData>> = new Map();
  private chartProviders: Map<string, () => Promise<ChartData>> = new Map();
  private tableProviders: Map<string, () => Promise<unknown[]>> = new Map();
  
  private isInitialized = false;

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): EnterpriseDashboardService {
    if (!EnterpriseDashboardService.instance) {
      EnterpriseDashboardService.instance = new EnterpriseDashboardService();
    }
    return EnterpriseDashboardService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('EnterpriseDashboardService initializing...');
    this.loadDashboards();
    this.loadAlerts();
    this.setupEventListeners();
    this.startDataRefresh();
    this.createDefaultDashboards();
    this.isInitialized = true;
    console.log('EnterpriseDashboardService initialized');
  }

  private initializeProviders(): void {
    // System metrics providers
    this.metricProviders.set('active_users', this.getActiveUsersMetric.bind(this));
    this.metricProviders.set('total_sessions', this.getTotalSessionsMetric.bind(this));
    this.metricProviders.set('system_uptime', this.getSystemUptimeMetric.bind(this));
    this.metricProviders.set('response_time', this.getResponseTimeMetric.bind(this));
    this.metricProviders.set('error_rate', this.getErrorRateMetric.bind(this));
    this.metricProviders.set('storage_usage', this.getStorageUsageMetric.bind(this));
    this.metricProviders.set('api_calls', this.getApiCallsMetric.bind(this));
    
    // Chart providers
    this.chartProviders.set('usage_trend', this.getUsageTrendChart.bind(this));
    this.chartProviders.set('user_activity', this.getUserActivityChart.bind(this));
    this.chartProviders.set('feature_usage', this.getFeatureUsageChart.bind(this));
    this.chartProviders.set('performance_trend', this.getPerformanceTrendChart.bind(this));
    this.chartProviders.set('tenant_distribution', this.getTenantDistributionChart.bind(this));
    
    // Table providers
    this.tableProviders.set('recent_sessions', this.getRecentSessionsTable.bind(this));
    this.tableProviders.set('audit_log', this.getAuditLogTable.bind(this));
    this.tableProviders.set('user_list', this.getUserListTable.bind(this));
    this.tableProviders.set('alert_history', this.getAlertHistoryTable.bind(this));
  }

  private setupEventListeners(): void {
    // Listen for system events to generate alerts
    window.addEventListener('systemError', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.createAlert({
        type: 'system',
        severity: 'error',
        title: 'System Error',
        message: customEvent.detail?.message || 'Unknown system error',
        source: customEvent.detail?.source || 'system'
      });
    });

    // Listen for compliance violations
    window.addEventListener('complianceViolation', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.createAlert({
        type: 'compliance',
        severity: 'critical',
        title: 'Compliance Violation',
        message: customEvent.detail?.message || 'Compliance violation detected',
        source: customEvent.detail?.source || 'compliance'
      });
    });

    // Listen for performance issues
    window.addEventListener('performanceIssue', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Performance Issue',
        message: customEvent.detail?.message || 'Performance degradation detected',
        source: customEvent.detail?.source || 'performance'
      });
    });

    // Listen for security events
    window.addEventListener('securityEvent', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.createAlert({
        type: 'security',
        severity: customEvent.detail?.severity || 'warning',
        title: 'Security Event',
        message: customEvent.detail?.message || 'Security event detected',
        source: customEvent.detail?.source || 'security'
      });
    });
  }

  // Dashboard Management
  async createDashboard(
    config: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Dashboard> {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check permissions
    if (!this.rbacService.hasPermission('dashboard.create')) {
      throw new Error('Insufficient permissions to create dashboard');
    }

    const dashboardId = `dashboard-${Date.now()}`;
    const dashboard: Dashboard = {
      ...config,
      id: dashboardId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate widgets
    this.validateDashboardWidgets(dashboard.widgets);

    this.dashboards.set(dashboardId, dashboard);
    this.saveDashboards();

    // Set up widget refresh intervals
    this.setupWidgetRefresh(dashboard);

    this.auditService.logAction('dashboard_created', {
      dashboardId,
      name: dashboard.name,
      type: dashboard.type,
      userId: currentUser.id
    });

    this.analyticsService.trackEvent('dashboard_created', {
      dashboardId,
      type: dashboard.type,
      widgetCount: dashboard.widgets.length
    });

    return dashboard;
  }

  async updateDashboard(
    dashboardId: string,
    updates: Partial<Dashboard>
  ): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    // Check permissions
    if (!this.canEditDashboard(dashboard)) {
      throw new Error('Insufficient permissions to edit dashboard');
    }

    // Apply updates
    Object.assign(dashboard, updates);
    dashboard.updatedAt = new Date();

    // Validate updated widgets
    if (updates.widgets) {
      this.validateDashboardWidgets(updates.widgets);
      this.setupWidgetRefresh(dashboard);
    }

    this.dashboards.set(dashboardId, dashboard);
    this.saveDashboards();

    this.auditService.logAction('dashboard_updated', {
      dashboardId,
      changes: Object.keys(updates)
    });

    return dashboard;
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    // Check permissions
    if (!this.canDeleteDashboard(dashboard)) {
      throw new Error('Insufficient permissions to delete dashboard');
    }

    // Clear refresh intervals
    this.clearWidgetRefresh(dashboard);

    this.dashboards.delete(dashboardId);
    this.saveDashboards();

    this.auditService.logAction('dashboard_deleted', {
      dashboardId,
      name: dashboard.name
    });
  }

  // Widget Management
  async addWidget(dashboardId: string, widget: DashboardWidget): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    if (!this.canEditDashboard(dashboard)) {
      throw new Error('Insufficient permissions to add widget');
    }

    // Validate widget
    this.validateWidget(widget);

    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.saveDashboards();

    // Start refresh for new widget
    this.startWidgetRefresh(widget);

    this.auditService.logAction('widget_added', {
      dashboardId,
      widgetId: widget.id,
      widgetType: widget.type
    });

    return dashboard;
  }

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    if (!this.canEditDashboard(dashboard)) {
      throw new Error('Insufficient permissions to update widget');
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    const widget = dashboard.widgets[widgetIndex];
    Object.assign(widget, updates);
    widget.lastUpdated = new Date();
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.saveDashboards();

    // Restart refresh if interval changed
    if (updates.refreshInterval !== undefined) {
      this.stopWidgetRefresh(widget);
      this.startWidgetRefresh(widget);
    }

    this.auditService.logAction('widget_updated', {
      dashboardId,
      widgetId,
      changes: Object.keys(updates)
    });

    return dashboard;
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    if (!this.canEditDashboard(dashboard)) {
      throw new Error('Insufficient permissions to remove widget');
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    const widget = dashboard.widgets[widgetIndex];
    this.stopWidgetRefresh(widget);

    dashboard.widgets.splice(widgetIndex, 1);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    this.saveDashboards();

    this.auditService.logAction('widget_removed', {
      dashboardId,
      widgetId,
      widgetType: widget.type
    });

    return dashboard;
  }

  // Data Providers - Metrics
  private async getActiveUsersMetric(): Promise<MetricData> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');

    const users = this.multiTenantService.getTenantUsers(tenant.id);
    const activeUsers = users.filter(u => u.status === 'active');
    const previousCount = this.dataService.getData(`tenant_${tenant.id}_previous_active_users`) || activeUsers.length;

    const change = activeUsers.length - previousCount;
    const changePercent = previousCount > 0 ? (change / previousCount) * 100 : 0;

    this.dataService.setData(`tenant_${tenant.id}_previous_active_users`, activeUsers.length);

    return {
      label: 'Active Users',
      value: activeUsers.length,
      previousValue: previousCount,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      status: activeUsers.length > tenant.limits.maxUsers * 0.8 ? 'warning' : 'good',
      unit: 'users',
      target: tenant.limits.maxUsers,
      lastUpdated: new Date()
    };
  }

  private async getTotalSessionsMetric(): Promise<MetricData> {
    const sessionsData = this.dataService.getData('usage_sessions') || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = sessionsData.filter((session: { startTime: string }) => 
      new Date(session.startTime) >= today
    );

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySessions = sessionsData.filter((session: { startTime: string }) => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= yesterday && sessionDate < today;
    });

    const change = todaySessions.length - yesterdaySessions.length;
    const changePercent = yesterdaySessions.length > 0 ? (change / yesterdaySessions.length) * 100 : 0;

    return {
      label: 'Today Sessions',
      value: todaySessions.length,
      previousValue: yesterdaySessions.length,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      status: todaySessions.length > 50 ? 'good' : todaySessions.length > 20 ? 'warning' : 'critical',
      unit: 'sessions',
      lastUpdated: new Date()
    };
  }

  private async getSystemUptimeMetric(): Promise<MetricData> {
    const startTime = this.dataService.getData('system_start_time') || Date.now();
    const uptime = Date.now() - startTime;
    const uptimeHours = uptime / (1000 * 60 * 60);

    return {
      label: 'System Uptime',
      value: uptimeHours,
      trend: 'up',
      status: uptimeHours > 24 ? 'good' : uptimeHours > 12 ? 'warning' : 'critical',
      unit: 'hours',
      lastUpdated: new Date()
    };
  }

  private async getResponseTimeMetric(): Promise<MetricData> {
    const responseTimes = this.dataService.getData('response_times') || [];
    const recentTimes = responseTimes.slice(-10);
    const avgResponseTime = recentTimes.reduce((sum: number, time: number) => sum + time, 0) / recentTimes.length || 0;

    return {
      label: 'Avg Response Time',
      value: avgResponseTime,
      trend: avgResponseTime < 100 ? 'stable' : 'up',
      status: avgResponseTime < 100 ? 'good' : avgResponseTime < 500 ? 'warning' : 'critical',
      unit: 'ms',
      target: 100,
      lastUpdated: new Date()
    };
  }

  private async getErrorRateMetric(): Promise<MetricData> {
    const totalRequests = this.dataService.getData('total_requests') || 0;
    const errorCount = this.dataService.getData('error_count') || 0;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      label: 'Error Rate',
      value: errorRate,
      trend: errorRate < 1 ? 'stable' : 'up',
      status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical',
      unit: '%',
      target: 1,
      lastUpdated: new Date()
    };
  }

  private async getStorageUsageMetric(): Promise<MetricData> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');

    const usage = this.multiTenantService.getTenantUsage(tenant.id);
    const used = usage?.storage.used || 0;
    const quota = tenant.limits.storageQuota;
    const percentage = (used / quota) * 100;

    return {
      label: 'Storage Usage',
      value: percentage,
      trend: percentage > 80 ? 'up' : 'stable',
      status: percentage < 70 ? 'good' : percentage < 90 ? 'warning' : 'critical',
      unit: '%',
      target: 80,
      lastUpdated: new Date()
    };
  }

  private async getApiCallsMetric(): Promise<MetricData> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');

    const usage = this.multiTenantService.getTenantUsage(tenant.id);
    const used = usage?.apiCalls.total || 0;
    const quota = tenant.limits.apiCallsPerMonth;
    const percentage = (used / quota) * 100;

    return {
      label: 'API Calls',
      value: used,
      trend: percentage > 80 ? 'up' : 'stable',
      status: percentage < 70 ? 'good' : percentage < 90 ? 'warning' : 'critical',
      unit: 'calls',
      target: quota,
      lastUpdated: new Date()
    };
  }

  // Data Providers - Charts
  private async getUsageTrendChart(): Promise<ChartData> {
    const sessions = this.dataService.getData('usage_sessions') || [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const dailyUsage = last7Days.map(day => {
      return sessions.filter((session: { startTime: string }) => 
        new Date(session.startTime).toDateString() === day
      ).length;
    });

    return {
      labels: last7Days.map(day => new Date(day).toLocaleDateString()),
      datasets: [{
        label: 'Daily Sessions',
        data: dailyUsage,
        borderColor: '#7B3FF2',
        backgroundColor: 'rgba(123, 63, 242, 0.1)',
        fill: true
      }],
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private async getUserActivityChart(): Promise<ChartData> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');

    const users = this.multiTenantService.getTenantUsers(tenant.id);
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;

    return {
      labels: ['Active', 'Inactive', 'Pending'],
      datasets: [{
        label: 'User Status',
        data: [activeUsers, inactiveUsers, pendingUsers],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
      }],
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' as const }
        }
      }
    };
  }

  private async getFeatureUsageChart(): Promise<ChartData> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');

    const featureUsage = this.dataService.getData(`tenant_${tenant.id}_feature_usage`) || {};
    const features = Object.keys(featureUsage).slice(0, 10);
    const usage = features.map(feature => featureUsage[feature]);

    return {
      labels: features,
      datasets: [{
        label: 'Feature Usage',
        data: usage,
        backgroundColor: '#FF006E',
        borderColor: '#FF006E',
        borderWidth: 1
      }],
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private async getPerformanceTrendChart(): Promise<ChartData> {
    const responseTimes = this.dataService.getData('response_times') || [];
    const last24Hours = responseTimes.slice(-24);
    const labels = last24Hours.map((_: unknown, i: number) => `${i}h ago`);

    return {
      labels,
      datasets: [{
        label: 'Response Time (ms)',
        data: last24Hours,
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true
      }],
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private async getTenantDistributionChart(): Promise<ChartData> {
    const tenants = this.multiTenantService.getAllTenants();
    const types = tenants.reduce((acc: Record<string, number>, tenant) => {
      acc[tenant.type] = (acc[tenant.type] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(types),
      datasets: [{
        label: 'Tenant Types',
        data: Object.values(types),
        backgroundColor: ['#7B3FF2', '#FF006E', '#06B6D4', '#10B981']
      }],
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' as const }
        }
      }
    };
  }

  // Data Providers - Tables
  private async getRecentSessionsTable(): Promise<unknown[]> {
    const sessions = this.dataService.getData('usage_sessions') || [];
    return sessions
      .slice(-50)
      .map((session: { id: string; startTime: string; duration: number; wordCount: number }) => ({
        id: session.id,
        startTime: new Date(session.startTime).toLocaleString(),
        duration: Math.round(session.duration / 1000 / 60),
        words: session.wordCount
      }));
  }

  private async getAuditLogTable(): Promise<unknown[]> {
    const auditLog = this.auditService.getAuditLog();
    return auditLog.slice(-100).map(entry => ({
      timestamp: entry.timestamp.toLocaleString(),
      action: entry.action,
      user: entry.userId || 'System',
      details: JSON.stringify(entry.details)
    }));
  }

  private async getUserListTable(): Promise<unknown[]> {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) return [];

    const users = this.multiTenantService.getTenantUsers(tenant.id);
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
    }));
  }

  private async getAlertHistoryTable(): Promise<unknown[]> {
    return Array.from(this.alerts.values())
      .slice(-50)
      .map(alert => ({
        timestamp: alert.timestamp.toLocaleString(),
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        status: alert.resolved ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Open'
      }));
  }

  // Widget Data Management
  async refreshWidgetData(widgetId: string): Promise<unknown> {
    const widget = this.findWidgetById(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    let data: unknown;

    try {
      switch (widget.type) {
        case 'metric':
          const metricProvider = this.metricProviders.get(widget.dataSource);
          if (metricProvider) {
            data = await metricProvider();
          }
          break;

        case 'chart':
          const chartProvider = this.chartProviders.get(widget.dataSource);
          if (chartProvider) {
            data = await chartProvider();
          }
          break;

        case 'table':
          const tableProvider = this.tableProviders.get(widget.dataSource);
          if (tableProvider) {
            data = await tableProvider();
          }
          break;

        case 'alert':
          data = this.getActiveAlerts();
          break;

        default:
          throw new Error(`Unsupported widget type: ${widget.type}`);
      }

      this.widgetData.set(widgetId, data);
      widget.lastUpdated = new Date();

      return data;
    } catch (error) {
      console.error(`Error refreshing widget ${widgetId}:`, error);
      throw error;
    }
  }

  getWidgetData(widgetId: string): unknown {
    return this.widgetData.get(widgetId);
  }

  // Alert Management
  createAlert(config: Omit<AlertData, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): AlertData {
    const alertId = `alert-${Date.now()}`;
    const alert: AlertData = {
      ...config,
      id: alertId,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.saveAlerts();

    // Emit alert event
    window.dispatchEvent(new CustomEvent('dashboardAlert', {
      detail: { alert }
    }));

    this.analyticsService.trackEvent('alert_created', {
      alertId,
      type: alert.type,
      severity: alert.severity
    });

    return alert;
  }

  acknowledgeAlert(alertId: string, userId?: string): AlertData {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId || 'system';
    alert.acknowledgedAt = new Date();

    this.alerts.set(alertId, alert);
    this.saveAlerts();

    this.auditService.logAction('alert_acknowledged', {
      alertId,
      userId
    });

    return alert;
  }

  resolveAlert(alertId: string, userId?: string): AlertData {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedBy = userId || 'system';
    alert.resolvedAt = new Date();

    this.alerts.set(alertId, alert);
    this.saveAlerts();

    this.auditService.logAction('alert_resolved', {
      alertId,
      userId
    });

    return alert;
  }

  getActiveAlerts(): AlertData[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  // Dashboard Export
  async exportDashboard(dashboardId: string, config: DashboardExport): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    if (!this.canExportDashboard(dashboard)) {
      throw new Error('Insufficient permissions to export dashboard');
    }

    // Refresh widget data
    const widgetData: Record<string, unknown> = {};
    for (const widgetId of config.widgets) {
      try {
        widgetData[widgetId] = await this.refreshWidgetData(widgetId);
      } catch (error) {
        console.warn(`Failed to refresh widget ${widgetId}:`, error);
      }
    }

    const exportData = {
      dashboard: {
        name: dashboard.name,
        description: dashboard.description,
        type: dashboard.type,
        exportedAt: new Date().toISOString(),
        widgets: dashboard.widgets.filter(w => config.widgets.includes(w.id))
      },
      data: widgetData,
      meta: config.includeMeta ? {
        tenant: this.multiTenantService.getCurrentTenant(),
        user: this.rbacService.getCurrentUser(),
        timeRange: config.timeRange
      } : undefined
    };

    let result: string;

    switch (config.format) {
      case 'json':
        result = JSON.stringify(exportData, null, 2);
        break;

      case 'csv':
        result = this.convertToCSV(exportData);
        break;

      default:
        throw new Error(`Export format ${config.format} not yet implemented`);
    }

    this.auditService.logAction('dashboard_exported', {
      dashboardId,
      format: config.format,
      widgetCount: config.widgets.length
    });

    return result;
  }

  private convertToCSV(data: unknown): string {
    // Simple CSV conversion - would need more sophisticated implementation
    return JSON.stringify(data);
  }

  // Permission Checks
  private canViewDashboard(dashboard: Dashboard): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    if (dashboard.ownerId === currentUser.id) return true;
    if (dashboard.permissions.view.includes(currentUser.id)) return true;
    
    return dashboard.permissions.view.some(permission => 
      this.rbacService.hasRole(permission) || this.rbacService.hasPermission(permission)
    );
  }

  private canEditDashboard(dashboard: Dashboard): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    if (dashboard.ownerId === currentUser.id) return true;
    if (dashboard.permissions.edit.includes(currentUser.id)) return true;
    
    return dashboard.permissions.edit.some(permission => 
      this.rbacService.hasRole(permission) || this.rbacService.hasPermission(permission)
    );
  }

  private canDeleteDashboard(dashboard: Dashboard): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    if (dashboard.ownerId === currentUser.id) return true;
    if (dashboard.permissions.admin.includes(currentUser.id)) return true;
    
    return dashboard.permissions.admin.some(permission => 
      this.rbacService.hasRole(permission) || this.rbacService.hasPermission(permission)
    );
  }

  private canExportDashboard(dashboard: Dashboard): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    if (dashboard.ownerId === currentUser.id) return true;
    if (dashboard.permissions.export.includes(currentUser.id)) return true;
    
    return dashboard.permissions.export.some(permission => 
      this.rbacService.hasRole(permission) || this.rbacService.hasPermission(permission)
    );
  }

  // Widget Refresh Management
  private setupWidgetRefresh(dashboard: Dashboard): void {
    dashboard.widgets.forEach(widget => {
      this.startWidgetRefresh(widget);
    });
  }

  private startWidgetRefresh(widget: DashboardWidget): void {
    if (!widget.refreshInterval || widget.refreshInterval <= 0) return;

    const intervalId = setInterval(async () => {
      try {
        await this.refreshWidgetData(widget.id);
      } catch (error) {
        console.error(`Auto-refresh failed for widget ${widget.id}:`, error);
      }
    }, widget.refreshInterval * 1000);

    this.refreshIntervals.set(widget.id, intervalId);
  }

  private stopWidgetRefresh(widget: DashboardWidget): void {
    const intervalId = this.refreshIntervals.get(widget.id);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(widget.id);
    }
  }

  private clearWidgetRefresh(dashboard: Dashboard): void {
    dashboard.widgets.forEach(widget => {
      this.stopWidgetRefresh(widget);
    });
  }

  private startDataRefresh(): void {
    // Refresh all visible widgets every 30 seconds
    setInterval(() => {
      this.dashboards.forEach(dashboard => {
        if (dashboard.settings.autoRefresh) {
          dashboard.widgets
            .filter(widget => widget.isVisible && !widget.refreshInterval)
            .forEach(async widget => {
              try {
                await this.refreshWidgetData(widget.id);
              } catch (error) {
                console.error(`Global refresh failed for widget ${widget.id}:`, error);
              }
            });
        }
      });
    }, 30000);
  }

  // Validation
  private validateDashboardWidgets(widgets: DashboardWidget[]): void {
    widgets.forEach(widget => this.validateWidget(widget));
  }

  private validateWidget(widget: DashboardWidget): void {
    if (!widget.id || !widget.type || !widget.title) {
      throw new Error('Widget must have id, type, and title');
    }

    if (!widget.dataSource) {
      throw new Error('Widget must have a data source');
    }

    if (!this.isValidDataSource(widget.type, widget.dataSource)) {
      throw new Error(`Invalid data source ${widget.dataSource} for widget type ${widget.type}`);
    }
  }

  private isValidDataSource(widgetType: string, dataSource: string): boolean {
    switch (widgetType) {
      case 'metric':
        return this.metricProviders.has(dataSource);
      case 'chart':
        return this.chartProviders.has(dataSource);
      case 'table':
        return this.tableProviders.has(dataSource);
      case 'alert':
        return dataSource === 'active_alerts';
      default:
        return false;
    }
  }

  // Default Dashboards
  private createDefaultDashboards(): void {
    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant) return;

    // Check if default dashboards already exist
    const existingDashboards = Array.from(this.dashboards.values())
      .filter(d => d.tenantId === tenant.id && d.type === 'executive');

    if (existingDashboards.length > 0) return;

    // Create Executive Dashboard
    this.createExecutiveDashboard(tenant.id);
    this.createOperationalDashboard(tenant.id);
    this.createAnalyticsDashboard(tenant.id);
  }

  private createExecutiveDashboard(tenantId: string): void {
    const dashboard: Dashboard = {
      id: `exec-dashboard-${tenantId}`,
      name: 'Executive Dashboard',
      description: 'High-level overview for executives',
      type: 'executive',
      tenantId,
      ownerId: 'system',
      widgets: [
        {
          id: 'exec-active-users',
          type: 'metric',
          title: 'Active Users',
          position: { x: 0, y: 0, w: 3, h: 2 },
          dataSource: 'active_users',
          config: { format: 'number', color: '#7B3FF2' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'exec-sessions-today',
          type: 'metric',
          title: 'Sessions Today',
          position: { x: 3, y: 0, w: 3, h: 2 },
          dataSource: 'total_sessions',
          config: { format: 'number', color: '#FF006E' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'exec-usage-trend',
          type: 'chart',
          title: 'Usage Trend',
          position: { x: 0, y: 2, w: 6, h: 4 },
          dataSource: 'usage_trend',
          config: { chartType: 'line' },
          permissions: ['view'],
          isVisible: true
        }
      ],
      layout: {
        cols: 12,
        rows: 20,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true,
        preventCollision: false
      },
      settings: {
        theme: 'light',
        autoRefresh: true,
        refreshInterval: 300,
        showGrid: false,
        snapToGrid: true,
        animations: true,
        notifications: true,
        exportEnabled: true,
        printEnabled: true
      },
      permissions: {
        view: ['executive', 'admin', 'super-admin'],
        edit: ['admin', 'super-admin'],
        admin: ['super-admin'],
        export: ['executive', 'admin', 'super-admin'],
        share: ['admin', 'super-admin']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: true,
      tags: ['executive', 'overview']
    };

    this.dashboards.set(dashboard.id, dashboard);
  }

  private createOperationalDashboard(tenantId: string): void {
    const dashboard: Dashboard = {
      id: `ops-dashboard-${tenantId}`,
      name: 'Operational Dashboard',
      description: 'System health and performance monitoring',
      type: 'operational',
      tenantId,
      ownerId: 'system',
      widgets: [
        {
          id: 'ops-uptime',
          type: 'metric',
          title: 'System Uptime',
          position: { x: 0, y: 0, w: 2, h: 2 },
          dataSource: 'system_uptime',
          config: { format: 'duration', color: '#10B981' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'ops-response-time',
          type: 'metric',
          title: 'Response Time',
          position: { x: 2, y: 0, w: 2, h: 2 },
          dataSource: 'response_time',
          config: { format: 'number', unit: 'ms', color: '#06B6D4' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'ops-error-rate',
          type: 'metric',
          title: 'Error Rate',
          position: { x: 4, y: 0, w: 2, h: 2 },
          dataSource: 'error_rate',
          config: { format: 'percentage', color: '#EF4444' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'ops-alerts',
          type: 'alert',
          title: 'Active Alerts',
          position: { x: 0, y: 2, w: 6, h: 4 },
          dataSource: 'active_alerts',
          config: { severity: 'warning' },
          permissions: ['view'],
          isVisible: true
        }
      ],
      layout: {
        cols: 12,
        rows: 20,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true,
        preventCollision: false
      },
      settings: {
        theme: 'light',
        autoRefresh: true,
        refreshInterval: 60,
        showGrid: true,
        snapToGrid: true,
        animations: false,
        notifications: true,
        exportEnabled: true,
        printEnabled: true
      },
      permissions: {
        view: ['admin', 'super-admin', 'tenant-admin'],
        edit: ['admin', 'super-admin'],
        admin: ['super-admin'],
        export: ['admin', 'super-admin'],
        share: ['admin', 'super-admin']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: true,
      tags: ['operations', 'monitoring']
    };

    this.dashboards.set(dashboard.id, dashboard);
  }

  private createAnalyticsDashboard(tenantId: string): void {
    const dashboard: Dashboard = {
      id: `analytics-dashboard-${tenantId}`,
      name: 'Analytics Dashboard',
      description: 'Usage analytics and insights',
      type: 'analytics',
      tenantId,
      ownerId: 'system',
      widgets: [
        {
          id: 'analytics-user-activity',
          type: 'chart',
          title: 'User Activity',
          position: { x: 0, y: 0, w: 6, h: 3 },
          dataSource: 'user_activity',
          config: { chartType: 'pie' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'analytics-features',
          type: 'chart',
          title: 'Feature Usage',
          position: { x: 6, y: 0, w: 6, h: 3 },
          dataSource: 'feature_usage',
          config: { chartType: 'bar' },
          permissions: ['view'],
          isVisible: true
        },
        {
          id: 'analytics-sessions',
          type: 'table',
          title: 'Recent Sessions',
          position: { x: 0, y: 3, w: 12, h: 4 },
          dataSource: 'recent_sessions',
          config: {
            columns: [
              { key: 'id', label: 'Session ID', type: 'string' },
              { key: 'startTime', label: 'Start Time', type: 'datetime' },
              { key: 'duration', label: 'Duration (min)', type: 'number' },
              { key: 'words', label: 'Words', type: 'number' }
            ]
          },
          permissions: ['view'],
          isVisible: true
        }
      ],
      layout: {
        cols: 12,
        rows: 20,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true,
        preventCollision: false
      },
      settings: {
        theme: 'light',
        autoRefresh: true,
        refreshInterval: 600,
        showGrid: false,
        snapToGrid: true,
        animations: true,
        notifications: false,
        exportEnabled: true,
        printEnabled: true
      },
      permissions: {
        view: ['analyst', 'admin', 'super-admin'],
        edit: ['admin', 'super-admin'],
        admin: ['super-admin'],
        export: ['analyst', 'admin', 'super-admin'],
        share: ['admin', 'super-admin']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: true,
      tags: ['analytics', 'insights']
    };

    this.dashboards.set(dashboard.id, dashboard);
  }

  // Utility Methods
  private findWidgetById(widgetId: string): DashboardWidget | null {
    for (const dashboard of this.dashboards.values()) {
      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (widget) return widget;
    }
    return null;
  }

  // Data Persistence
  private loadDashboards(): void {
    const saved = this.dataService.getData('dashboards');
    if (saved) {
      Object.entries(saved).forEach(([id, data]) => {
        const dashboard = data as Dashboard;
        // Convert date strings back to Date objects
        dashboard.createdAt = new Date(dashboard.createdAt);
        dashboard.updatedAt = new Date(dashboard.updatedAt);
        dashboard.widgets.forEach(widget => {
          if (widget.lastUpdated) {
            widget.lastUpdated = new Date(widget.lastUpdated);
          }
        });
        
        this.dashboards.set(id, dashboard);
      });
    }
  }

  private saveDashboards(): void {
    const dashboardData: Record<string, Dashboard> = {};
    this.dashboards.forEach((dashboard, id) => {
      dashboardData[id] = dashboard;
    });
    this.dataService.setData('dashboards', dashboardData);
  }

  private loadAlerts(): void {
    const saved = this.dataService.getData('dashboard_alerts') || [];
    saved.forEach((alert: AlertData) => {
      // Convert date strings back to Date objects
      alert.timestamp = new Date(alert.timestamp);
      if (alert.acknowledgedAt) {
        alert.acknowledgedAt = new Date(alert.acknowledgedAt);
      }
      if (alert.resolvedAt) {
        alert.resolvedAt = new Date(alert.resolvedAt);
      }
      
      this.alerts.set(alert.id, alert);
    });
  }

  private saveAlerts(): void {
    const alertData = Array.from(this.alerts.values());
    this.dataService.setData('dashboard_alerts', alertData);
  }

  // Public API
  getDashboards(tenantId?: string): Dashboard[] {
    const currentTenant = tenantId || this.multiTenantService.getCurrentTenant()?.id;
    if (!currentTenant) return [];

    return Array.from(this.dashboards.values())
      .filter(dashboard => dashboard.tenantId === currentTenant && this.canViewDashboard(dashboard))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getDashboard(dashboardId: string): Dashboard | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard || !this.canViewDashboard(dashboard)) {
      return null;
    }
    return dashboard;
  }

  getAvailableDataSources(): { metrics: string[]; charts: string[]; tables: string[] } {
    return {
      metrics: Array.from(this.metricProviders.keys()),
      charts: Array.from(this.chartProviders.keys()),
      tables: Array.from(this.tableProviders.keys())
    };
  }

  // Cleanup
  destroy(): void {
    // Clear all refresh intervals
    this.refreshIntervals.forEach(intervalId => clearInterval(intervalId));
    this.refreshIntervals.clear();
    
    // Save data
    this.saveDashboards();
    this.saveAlerts();
  }
}

export function getEnterpriseDashboardService(): EnterpriseDashboardService {
  return EnterpriseDashboardService.getInstance();
}