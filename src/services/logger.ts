// Production-ready logging service with multiple transports
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  stackTrace?: string;
}

class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private logLevel: keyof LogLevel = 'INFO';
  
  private constructor() {
    this.setupFlushInterval();
    this.setupErrorHandlers();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupFlushInterval() {
    // Flush logs every 5 seconds or when buffer reaches 100 entries
    this.flushInterval = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, 5000);
  }

  private setupErrorHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: event.reason
        });
      });
    }
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    // Add user context if available
    if (typeof window !== 'undefined') {
      const userContext = this.getUserContext();
      if (userContext.userId) entry.userId = userContext.userId;
      if (userContext.sessionId) entry.sessionId = userContext.sessionId;
    }

    // Add stack trace for errors
    if (metadata?.error instanceof Error) {
      entry.error = metadata.error;
      entry.stackTrace = metadata.error.stack;
    }

    return entry;
  }

  private getUserContext(): { userId?: string; sessionId?: string } {
    // Get from session storage or auth context
    return {
      userId: sessionStorage.getItem('userId') || undefined,
      sessionId: sessionStorage.getItem('sessionId') || undefined
    };
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: (keyof LogLevel)[] = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send to multiple destinations
      await Promise.all([
        this.sendToConsole(logsToSend),
        this.sendToLocalStorage(logsToSend),
        this.sendToRemote(logsToSend),
        this.sendToSentry(logsToSend.filter(log => log.level === 'ERROR'))
      ]);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add failed logs to buffer
      this.logBuffer.unshift(...logsToSend);
    }
  }

  private sendToConsole(logs: LogEntry[]) {
    logs.forEach(log => {
      const style = this.getConsoleStyle(log.level);
      const message = `%c[${log.timestamp}] [${log.level}] ${log.message}`;
      
      switch (log.level) {
        case 'ERROR':
          console.error(message, style, log.metadata);
          break;
        case 'WARN':
          console.warn(message, style, log.metadata);
          break;
        case 'DEBUG':
          console.debug(message, style, log.metadata);
          break;
        default:
          console.log(message, style, log.metadata);
      }
    });
  }

  private getConsoleStyle(level: keyof LogLevel): string {
    const styles = {
      ERROR: 'color: #ff0000; font-weight: bold;',
      WARN: 'color: #ff9800; font-weight: bold;',
      INFO: 'color: #2196f3;',
      DEBUG: 'color: #9e9e9e;'
    };
    return styles[level];
  }

  private sendToLocalStorage(logs: LogEntry[]) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      const allLogs = [...existingLogs, ...logs];
      
      // Keep only last 1000 logs
      const recentLogs = allLogs.slice(-1000);
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  private async sendToRemote(logs: LogEntry[]) {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('healthcare_auth_token')}`
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
    }
  }

  private async sendToSentry(errorLogs: LogEntry[]) {
    if (typeof window === 'undefined' || !window.Sentry) return;

    errorLogs.forEach(log => {
      window.Sentry.captureException(log.error || new Error(log.message), {
        level: 'error',
        tags: {
          userId: log.userId,
          sessionId: log.sessionId
        },
        extra: log.metadata
      });
    });
  }

  // Public logging methods
  error(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('ERROR')) return;
    
    const entry = this.createLogEntry('ERROR', message, metadata);
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= 100) {
      this.flush();
    }
  }

  warn(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('WARN')) return;
    
    const entry = this.createLogEntry('WARN', message, metadata);
    this.logBuffer.push(entry);
  }

  info(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('INFO')) return;
    
    const entry = this.createLogEntry('INFO', message, metadata);
    this.logBuffer.push(entry);
  }

  debug(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('DEBUG')) return;
    
    const entry = this.createLogEntry('DEBUG', message, metadata);
    this.logBuffer.push(entry);
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Audit logging for HIPAA compliance
  audit(action: string, resource: string, metadata?: Record<string, any>) {
    const auditEntry = {
      action,
      resource,
      timestamp: new Date().toISOString(),
      ...this.getUserContext(),
      ...metadata
    };

    // Always log audit events
    this.info(`AUDIT: ${action} on ${resource}`, auditEntry);
    
    // Store separately for compliance
    this.storeAuditLog(auditEntry);
  }

  private storeAuditLog(auditEntry: Record<string, any>) {
    try {
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      auditLogs.push(auditEntry);
      
      // Keep audit logs for compliance period
      const retentionDays = parseInt(process.env.HIPAA_AUDIT_LOG_RETENTION_DAYS || '2555');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const recentAuditLogs = auditLogs.filter((log: any) => 
        new Date(log.timestamp) > cutoffDate
      );
      
      localStorage.setItem('audit_logs', JSON.stringify(recentAuditLogs));
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }

  // Get logs for debugging
  getLogs(filter?: { level?: keyof LogLevel; startDate?: Date; endDate?: Date }): LogEntry[] {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      
      return logs.filter((log: LogEntry) => {
        if (filter?.level && log.level !== filter.level) return false;
        if (filter?.startDate && new Date(log.timestamp) < filter.startDate) return false;
        if (filter?.endDate && new Date(log.timestamp) > filter.endDate) return false;
        return true;
      });
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  // Clear old logs
  clearOldLogs(daysToKeep: number = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      const recentLogs = logs.filter((log: LogEntry) => 
        new Date(log.timestamp) > cutoffDate
      );
      
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
      this.info(`Cleared ${logs.length - recentLogs.length} old logs`);
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }

  // Set log level
  setLogLevel(level: keyof LogLevel) {
    this.logLevel = level;
    this.info(`Log level set to ${level}`);
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export types
export type { LogLevel, LogEntry };