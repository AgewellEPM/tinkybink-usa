import React, { useState, useEffect, useRef } from 'react';
import { healthcareAPI } from '@/services/healthcare-api';
import { useHealthcare } from '@/contexts/HealthcareContext';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
  service?: string;
  details?: any;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  database: { connections: number; queryTime: number };
}

export const EnhancedMonitoringTab: React.FC = () => {
  const { subscribeToUpdates } = useHealthcare();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  
  // Polling intervals
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const healthIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initial load
    loadMonitoringData();
    
    // Set up polling
    metricsIntervalRef.current = setInterval(fetchSystemMetrics, 5000); // Every 5 seconds
    healthIntervalRef.current = setInterval(fetchSystemHealth, 30000); // Every 30 seconds
    
    // Subscribe to real-time alerts
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.type === 'system_alert') {
        handleNewAlert(update.data);
      } else if (update.type === 'metrics_update') {
        setSystemMetrics(update.data);
      }
    });
    
    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      unsubscribe();
    };
  }, []);

  const loadMonitoringData = async () => {
    await Promise.all([
      fetchSystemHealth(),
      fetchSystemMetrics(),
      fetchRecentAlerts()
    ]);
  };

  const fetchSystemHealth = async () => {
    try {
      const health = await healthcareAPI.getSystemHealth();
      setSystemHealth(health);
      setIsConnected(true);
      
      // Check for unhealthy services and create alerts
      health.services.forEach((service: any) => {
        if (service.status === 'down') {
          handleNewAlert({
            id: `service-${service.name}-${Date.now()}`,
            type: 'error',
            message: `${service.name} service is down`,
            timestamp: new Date(),
            resolved: false,
            service: service.name
          });
        }
      });
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      setIsConnected(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const metrics = await healthcareAPI.getSystemMetrics();
      setSystemMetrics(metrics);
      
      // Add to historical data for charts
      setHistoricalData(prev => [...prev.slice(-59), {
        timestamp: new Date(),
        ...metrics
      }]);
      
      // Check thresholds and create alerts
      checkMetricThresholds(metrics);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const fetchRecentAlerts = async () => {
    // In production, this would fetch from API
    // For now, generate some sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: '1',
        type: 'info',
        message: 'System backup completed successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: true,
        service: 'Backup Service'
      },
      {
        id: '2',
        type: 'warning',
        message: 'High API response time detected (>500ms)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false,
        service: 'API Gateway'
      }
    ];
    setAlerts(sampleAlerts);
  };

  const checkMetricThresholds = (metrics: SystemMetrics) => {
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 80, critical: 90 },
      databaseConnections: { warning: 80, critical: 95 }
    };
    
    // CPU check
    if (metrics.cpu > thresholds.cpu.critical) {
      createAlert('error', `Critical CPU usage: ${metrics.cpu}%`, 'System');
    } else if (metrics.cpu > thresholds.cpu.warning) {
      createAlert('warning', `High CPU usage: ${metrics.cpu}%`, 'System');
    }
    
    // Memory check
    if (metrics.memory > thresholds.memory.critical) {
      createAlert('error', `Critical memory usage: ${metrics.memory}%`, 'System');
    } else if (metrics.memory > thresholds.memory.warning) {
      createAlert('warning', `High memory usage: ${metrics.memory}%`, 'System');
    }
    
    // Disk check
    if (metrics.disk > thresholds.disk.critical) {
      createAlert('error', `Critical disk usage: ${metrics.disk}%`, 'Storage');
    } else if (metrics.disk > thresholds.disk.warning) {
      createAlert('warning', `High disk usage: ${metrics.disk}%`, 'Storage');
    }
    
    // Database connections check
    const dbUsage = (metrics.database.connections / 100) * 100;
    if (dbUsage > thresholds.databaseConnections.critical) {
      createAlert('error', `Critical database connection pool usage: ${dbUsage}%`, 'Database');
    }
  };

  const createAlert = (type: Alert['type'], message: string, service: string) => {
    const newAlert: Alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      service
    };
    
    // Check if similar alert already exists
    const exists = alerts.some(a => 
      a.message === message && 
      !a.resolved && 
      (new Date().getTime() - a.timestamp.getTime()) < 300000 // 5 minutes
    );
    
    if (!exists) {
      handleNewAlert(newAlert);
    }
  };

  const handleNewAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    
    // Play sound for critical alerts
    if (alert.type === 'error' && !alert.resolved) {
      playAlertSound();
    }
    
    // Send notification if enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TinkyBink Healthcare Alert', {
        body: alert.message,
        icon: '/icon-192x192.png'
      });
    }
  };

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const acknowledgeAlert = (alertId: string) => {
    // In production, this would call API to acknowledge
    resolveAlert(alertId);
  };

  const getMetricColor = (value: number, type: 'usage' | 'health') => {
    if (type === 'usage') {
      if (value > 90) return '#e74c3c';
      if (value > 70) return '#f39c12';
      return '#2ecc71';
    }
    return '#3498db';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#2ecc71';
      case 'degraded': return '#f39c12';
      case 'down': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notifications enabled! You will receive alerts for critical system events.');
      }
    }
  };

  // Render loading state
  if (!systemMetrics) {
    return (
      <div id="monitoring-tab" className="tab-content">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
          <p>Connecting to monitoring system...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="monitoring-tab" className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Production Monitoring</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isConnected && (
            <span style={{ 
              padding: '5px 10px', 
              background: 'rgba(231, 76, 60, 0.2)', 
              border: '1px solid #e74c3c',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              ⚠️ Connection Lost
            </span>
          )}
          {'Notification' in window && Notification.permission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              style={{
                padding: '5px 10px',
                background: 'rgba(52, 152, 219, 0.2)',
                border: '1px solid #3498db',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔔 Enable Alerts
            </button>
          )}
        </div>
      </div>

      {/* System Health Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: systemHealth ? `rgba(46, 204, 113, 0.1)` : 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: systemHealth ? `2px solid ${getHealthColor(systemHealth.status)}` : 'none'
        }}>
          <h4 style={{ color: systemHealth ? getHealthColor(systemHealth.status) : '#999', margin: '0 0 10px 0' }}>
            System Status
          </h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {systemHealth ? systemHealth.status.toUpperCase() : 'CHECKING...'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Uptime: {systemHealth ? `${systemHealth.uptime}%` : '—'}
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(52, 152, 219, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#3498db', margin: '0 0 10px 0' }}>Response Time</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {systemHealth ? `${systemHealth.responseTime}` : '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Average response
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(155, 89, 182, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#9b59b6', margin: '0 0 10px 0' }}>Active Users</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {systemHealth ? systemHealth.activeUsers.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Currently online
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(241, 196, 15, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#f1c40f', margin: '0 0 10px 0' }}>Error Rate</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {systemHealth ? `${systemHealth.errorRate}` : '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Last 24 hours
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <h4>System Resources</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h5>Resource Usage</h5>
          <div style={{ marginTop: '15px' }}>
            {/* CPU Usage */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>CPU Usage:</span>
                <span style={{ color: getMetricColor(systemMetrics.cpu, 'usage'), fontWeight: 'bold' }}>
                  {systemMetrics.cpu}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${systemMetrics.cpu}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.cpu, 'usage'),
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
            
            {/* Memory Usage */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Memory Usage:</span>
                <span style={{ color: getMetricColor(systemMetrics.memory, 'usage'), fontWeight: 'bold' }}>
                  {systemMetrics.memory}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${systemMetrics.memory}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.memory, 'usage'),
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
            
            {/* Disk Usage */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Disk Usage:</span>
                <span style={{ color: getMetricColor(systemMetrics.disk, 'usage'), fontWeight: 'bold' }}>
                  {systemMetrics.disk}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${systemMetrics.disk}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.disk, 'usage'),
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            {/* Network I/O */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Network I/O:</span>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  ↓ {(systemMetrics.network.in / 1024).toFixed(1)} MB/s | 
                  ↑ {(systemMetrics.network.out / 1024).toFixed(1)} MB/s
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h5>Database Performance</h5>
          <div style={{ marginTop: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Active Connections:</span>
              <strong style={{ color: getMetricColor((systemMetrics.database.connections / 100) * 100, 'usage') }}>
                {systemMetrics.database.connections}/100
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Avg Query Time:</span>
              <strong style={{ color: systemMetrics.database.queryTime > 100 ? '#f39c12' : '#2ecc71' }}>
                {systemMetrics.database.queryTime}ms
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Connection Pool:</span>
              <strong style={{ color: '#3498db' }}>
                {Math.round((systemMetrics.database.connections / 100) * 100)}% utilized
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}>
              <span>Cache Hit Rate:</span>
              <strong style={{ color: '#2ecc71' }}>98.5%</strong>
            </div>
          </div>

          {/* Service Status */}
          {systemHealth && systemHealth.services && (
            <div style={{ marginTop: '20px' }}>
              <h5>Service Status</h5>
              <div style={{ marginTop: '10px' }}>
                {systemHealth.services.map((service: any) => (
                  <div key={service.name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    background: service.status === 'up' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontSize: '12px' }}>{service.name}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: service.status === 'up' ? '#2ecc71' : '#e74c3c',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Alerts */}
      <h4>System Alerts</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
            <p>No active alerts. All systems operational.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '15px', 
                  background: `${getMetricColor(0, alert.type === 'error' ? 'usage' : 'health')}20`,
                  border: `1px solid ${getMetricColor(0, alert.type === 'error' ? 'usage' : 'health')}40`,
                  borderRadius: '8px',
                  opacity: alert.resolved ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{getAlertIcon(alert.type)}</span>
                    <span style={{ 
                      color: getMetricColor(alert.type === 'error' ? 90 : alert.type === 'warning' ? 70 : 0, 'usage'), 
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {alert.type.toUpperCase()}
                      {alert.resolved && ' (RESOLVED)'}
                    </span>
                    {alert.service && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px'
                      }}>
                        {alert.service}
                      </span>
                    )}
                  </div>
                  <div style={{ marginBottom: '5px', fontSize: '14px' }}>{alert.message}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>
                {!alert.resolved && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{ 
                        padding: '6px 12px', 
                        background: '#2ecc71', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Acknowledge
                    </button>
                    {alert.details && (
                      <button 
                        onClick={() => console.log('Show details:', alert.details)}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#3498db', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Details
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .loading-spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid var(--primary-color);
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};