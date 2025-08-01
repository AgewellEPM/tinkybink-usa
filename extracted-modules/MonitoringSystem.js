class MonitoringSystem {
      constructor() {
        this.metrics = {
          performance: [],
          errors: [],
          usage: [],
          custom: []
        };
        this.alerts = [];
        this.dashboardUrl = '/admin/monitoring';
        this.initializeMonitoring();
      }
      
      initializeMonitoring() {
        // Performance monitoring
        this.setupPerformanceObserver();
        
        // Error tracking
        this.setupErrorTracking();
        
        // Usage analytics
        this.setupUsageTracking();
        
        // Health checks
        this.startHealthChecks();
      }
      
      setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              this.recordPerformanceMetric({
                name: entry.name,
                type: entry.entryType,
                duration: entry.duration,
                timestamp: Date.now()
              });
            });
          });
          
          observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
        }
      }
      
      setupErrorTracking() {
        window.addEventListener('error', (event) => {
          this.recordError({
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            stack: event.error?.stack,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
          this.recordError({
            type: 'unhandledRejection',
            reason: event.reason,
            promise: event.promise,
            timestamp: Date.now()
          });
        });
      }
      
      setupUsageTracking() {
        // Track page views
        this.trackPageView();
        
        // Track user actions
        document.addEventListener('click', (e) => {
          const target = e.target.closest('[data-track]');
          if (target) {
            this.trackEvent({
              category: 'interaction',
              action: 'click',
              label: target.dataset.track,
              value: target.dataset.trackValue
            });
          }
        });
        
        // Track session duration
        let sessionStart = Date.now();
        window.addEventListener('beforeunload', () => {
          this.trackEvent({
            category: 'session',
            action: 'end',
            value: Date.now() - sessionStart
          });
        });
      }
      
      startHealthChecks() {
        // Check system health every 5 minutes
        setInterval(() => {
          this.performHealthCheck();
        }, 5 * 60 * 1000);
        
        // Initial check
        this.performHealthCheck();
      }
      
      async performHealthCheck() {
        const health = {
          timestamp: Date.now(),
          checks: {
            api: await this.checkAPI(),
            database: await this.checkDatabase(),
            storage: await this.checkStorage(),
            memory: this.checkMemory(),
            cpu: await this.checkCPU()
          }
        };
        
        // Alert if any checks fail
        Object.entries(health.checks).forEach(([service, status]) => {
          if (!status.healthy) {
            this.createAlert({
              severity: 'critical',
              service,
              message: status.message,
              timestamp: Date.now()
            });
          }
        });
        
        this.metrics.health = health;
      }
      
      async checkAPI() {
        try {
          const response = await fetch('/api/health');
          return {
            healthy: response.ok,
            responseTime: response.headers.get('X-Response-Time'),
            message: response.ok ? 'API is healthy' : 'API is down'
          };
        } catch (error) {
          return {
            healthy: false,
            message: `API error: ${error.message}`
          };
        }
      }
      
      async checkDatabase() {
        try {
          const response = await fetch('/api/health/db');
          const data = await response.json();
          return {
            healthy: data.status === 'ok',
            connections: data.connections,
            message: data.message
          };
        } catch (error) {
          return {
            healthy: false,
            message: `Database error: ${error.message}`
          };
        }
      }
      
      async checkStorage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const percentUsed = (estimate.usage / estimate.quota) * 100;
          
          return {
            healthy: percentUsed < 90,
            usage: estimate.usage,
            quota: estimate.quota,
            percentUsed,
            message: percentUsed < 90 ? 'Storage healthy' : 'Storage nearly full'
          };
        }
        
        return {
          healthy: true,
          message: 'Storage API not available'
        };
      }
      
      checkMemory() {
        if ('memory' in performance) {
          const used = performance.memory.usedJSHeapSize;
          const total = performance.memory.totalJSHeapSize;
          const limit = performance.memory.jsHeapSizeLimit;
          const percentUsed = (used / limit) * 100;
          
          return {
            healthy: percentUsed < 90,
            used,
            total,
            limit,
            percentUsed,
            message: percentUsed < 90 ? 'Memory usage normal' : 'High memory usage'
          };
        }
        
        return {
          healthy: true,
          message: 'Memory API not available'
        };
      }
      
      async checkCPU() {
        // Estimate CPU usage by measuring task execution time
        const start = performance.now();
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.sqrt(i);
        }
        const duration = performance.now() - start;
        
        return {
          healthy: duration < 100,
          executionTime: duration,
          message: duration < 100 ? 'CPU performance normal' : 'High CPU usage detected'
        };
      }
      
      recordPerformanceMetric(metric) {
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
            message: `Slow ${metric.type}: ${metric.name} took ${metric.duration}ms`,
            metric
          });
        }
      }
      
      recordError(error) {
        this.metrics.errors.push(error);
        
        // Send to error tracking service
        this.sendToErrorTracking(error);
        
        // Create alert for critical errors
        if (error.source?.includes('critical') || error.message?.includes('FATAL')) {
          this.createAlert({
            severity: 'critical',
            type: 'error',
            error
          });
        }
      }
      
      trackEvent(event) {
        this.metrics.usage.push({
          ...event,
          timestamp: Date.now(),
          userId: window.authSystem?.getCurrentUser()?.id,
          sessionId: this.sessionId
        });
        
        // Send to analytics service
        this.sendToAnalytics(event);
      }
      
      trackPageView() {
        this.trackEvent({
          category: 'navigation',
          action: 'pageview',
          label: window.location.pathname,
          title: document.title
        });
      }
      
      createAlert(alert) {
        alert.id = crypto.randomUUID();
        alert.resolved = false;
        
        this.alerts.push(alert);
        
        // Show in UI if critical
        if (alert.severity === 'critical') {
          this.showCriticalAlert(alert);
        }
        
        // Send notifications
        this.sendAlertNotifications(alert);
      }
      
      showCriticalAlert(alert) {
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
          animation: shake 0.5s;
        `;
        
        container.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
            <strong>Critical Alert</strong>
          </div>
          <div>${alert.message || 'System error detected'}</div>
          <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
          ">×</button>
        `;
        
        document.body.appendChild(container);
      }
      
      async sendAlertNotifications(alert) {
        // Send to monitoring service
        await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          },
          body: JSON.stringify(alert)
        });
        
        // Send email/SMS for critical alerts
        if (alert.severity === 'critical') {
          await fetch('/api/notifications/critical', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'alert',
              alert,
              recipients: ['admin@tinkybink.com']
            })
          });
        }
      }
      
      async sendToErrorTracking(error) {
        // Send to Sentry/Rollbar/etc
        if (window.Sentry) {
          window.Sentry.captureException(new Error(error.message), {
            extra: error
          });
        }
      }
      
      async sendToAnalytics(event) {
        // Send to Google Analytics/Mixpanel/etc
        if (window.gtag) {
          window.gtag('event', event.action, {
            event_category: event.category,
            event_label: event.label,
            value: event.value
          });
        }
      }
      
      generateMetricsReport() {
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
          }
        };
      }
      
      calculateAvgResponseTime(since) {
        const recent = this.metrics.performance.filter(m => 
          m.timestamp > since && m.type === 'resource'
        );
        
        if (recent.length === 0) return 0;
        
        const total = recent.reduce((sum, m) => sum + m.duration, 0);
        return total / recent.length;
      }
      
      calculate95thPercentile(since) {
        const durations = this.metrics.performance
          .filter(m => m.timestamp > since && m.type === 'resource')
          .map(m => m.duration)
          .sort((a, b) => a - b);
        
        if (durations.length === 0) return 0;
        
        const index = Math.floor(durations.length * 0.95);
        return durations[index];
      }
      
      calculateErrorRate(since) {
        const totalRequests = this.metrics.performance.filter(m => 
          m.timestamp > since && m.type === 'resource'
        ).length;
        
        const errors = this.metrics.errors.filter(e => e.timestamp > since).length;
        
        return totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
      }
      
      calculateUptime() {
        // Calculate based on health checks
        const checks = this.metrics.health?.checks || {};
        const healthyServices = Object.values(checks).filter(c => c.healthy).length;
        const totalServices = Object.keys(checks).length;
        
        return totalServices > 0 ? (healthyServices / totalServices) * 100 : 100;
      }
      
      countActiveUsers(since) {
        const userIds = new Set(
          this.metrics.usage
            .filter(e => e.timestamp > since && e.userId)
            .map(e => e.userId)
        );
        
        return userIds.size;
      }
      
      getTopEvents(since) {
        const eventCounts = {};
        
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
      
      exportMetrics(format = 'json') {
        const data = {
          metrics: this.metrics,
          alerts: this.alerts,
          report: this.generateMetricsReport()
        };
        
        switch (format) {
          case 'json':
            this.downloadJSON(data);
            break;
          case 'csv':
            this.downloadCSV(data);
            break;
          case 'prometheus':
            return this.formatPrometheus(data);
        }
      }
      
      downloadJSON(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${new Date().toISOString()}.json`;
        a.click();
      }
      
      downloadCSV(data) {
        // Convert metrics to CSV format
        const csv = this.convertToCSV(data.metrics.usage);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${new Date().toISOString()}.csv`;
        a.click();
      }
      
      convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
          headers.map(header => JSON.stringify(row[header] || '')).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
      }
      
      formatPrometheus(data) {
        // Format metrics for Prometheus
        const metrics = [];
        
        // Response time metrics
        metrics.push(`# HELP http_request_duration_seconds HTTP request latency`);
        metrics.push(`# TYPE http_request_duration_seconds histogram`);
        metrics.push(`http_request_duration_seconds_sum ${data.report.performance.avgResponseTime}`);
        
        // Error rate
        metrics.push(`# HELP http_requests_errors_total Total HTTP errors`);
        metrics.push(`# TYPE http_requests_errors_total counter`);
        metrics.push(`http_requests_errors_total ${data.metrics.errors.length}`);
        
        // Active users
        metrics.push(`# HELP active_users_total Current active users`);
        metrics.push(`# TYPE active_users_total gauge`);
        metrics.push(`active_users_total ${data.report.usage.activeUsers}`);
        
        return metrics.join('\n');
      }
    }
    
    // Initialize Healthcare Production Systems
    window.HealthcareSystem = {
      insurance: new InsuranceClearinghouseAPI(),
      payment: new PaymentProcessor(),
      compliance: new ComplianceSystem(),
      subscription: new SubscriptionManager(),
      whiteLabel: new WhiteLabelConfig(),
      monitoring: new MonitoringSystem()
    };
    
    // Expose to global scope for easy access
    window.insuranceAPI = window.HealthcareSystem.insurance;
    window.paymentProcessor = window.HealthcareSystem.payment;
    window.complianceSystem = window.HealthcareSystem.compliance;
    window.subscriptionManager = window.HealthcareSystem.subscription;
    window.whiteLabelConfig = window.HealthcareSystem.whiteLabel;
    window.monitoringSystem = window.HealthcareSystem.monitoring;
    
    console.log('✅ Healthcare Production Systems initialized');
    
    // Billing & Insurance Data Manager