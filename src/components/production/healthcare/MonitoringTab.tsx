import React, { useState, useEffect } from 'react';

export const MonitoringTab: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: '99.9%',
    responseTime: '124ms',
    activeUsers: 1247,
    errorRate: '0.02%',
    serverLoad: 68,
    databaseConnections: 45,
    memoryUsage: 72,
    diskUsage: 34
  });

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      message: 'High memory usage detected on server-02',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolved: true
    },
    {
      id: 3,
      type: 'error',
      message: 'Payment gateway timeout (resolved)',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      resolved: true
    }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        responseTime: Math.max(80, Math.min(200, parseInt(prev.responseTime) + Math.floor(Math.random() * 20) - 10)) + 'ms',
        serverLoad: Math.max(20, Math.min(95, prev.serverLoad + Math.floor(Math.random() * 10) - 5)),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + Math.floor(Math.random() * 6) - 3)),
        databaseConnections: Math.max(20, Math.min(80, prev.databaseConnections + Math.floor(Math.random() * 6) - 3))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const resolveAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getMetricColor = (value: number, type: 'usage' | 'load') => {
    if (type === 'usage' || type === 'load') {
      if (value > 80) return '#e74c3c';
      if (value > 60) return '#f39c12';
      return '#2ecc71';
    }
    return '#3498db';
  };

  return (
    <div id="monitoring-tab" className="tab-content">
      <h3>Production Monitoring</h3>
      
      {/* System Health Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(46, 204, 113, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#2ecc71', margin: '0 0 10px 0' }}>System Uptime</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{systemMetrics.uptime}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Last 30 days</div>
        </div>
        
        <div style={{ 
          background: 'rgba(52, 152, 219, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#3498db', margin: '0 0 10px 0' }}>Response Time</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{systemMetrics.responseTime}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Average response</div>
        </div>
        
        <div style={{ 
          background: 'rgba(155, 89, 182, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#9b59b6', margin: '0 0 10px 0' }}>Active Users</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{systemMetrics.activeUsers.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Currently online</div>
        </div>
        
        <div style={{ 
          background: 'rgba(241, 196, 15, 0.1)', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#f1c40f', margin: '0 0 10px 0' }}>Error Rate</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{systemMetrics.errorRate}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Last 24 hours</div>
        </div>
      </div>

      {/* Server Metrics */}
      <h4>Server Metrics</h4>
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
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Server Load:</span>
                <span style={{ color: getMetricColor(systemMetrics.serverLoad, 'load') }}>
                  {systemMetrics.serverLoad}%
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
                  width: `${systemMetrics.serverLoad}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.serverLoad, 'load'),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Memory Usage:</span>
                <span style={{ color: getMetricColor(systemMetrics.memoryUsage, 'usage') }}>
                  {systemMetrics.memoryUsage}%
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
                  width: `${systemMetrics.memoryUsage}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.memoryUsage, 'usage'),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Disk Usage:</span>
                <span style={{ color: getMetricColor(systemMetrics.diskUsage, 'usage') }}>
                  {systemMetrics.diskUsage}%
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
                  width: `${systemMetrics.diskUsage}%`, 
                  height: '100%', 
                  background: getMetricColor(systemMetrics.diskUsage, 'usage'),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h5>Database Status</h5>
          <div style={{ marginTop: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Active Connections:</span>
              <strong>{systemMetrics.databaseConnections}/100</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Query Performance:</span>
              <strong style={{ color: '#2ecc71' }}>Optimal</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Backup Status:</span>
              <strong style={{ color: '#2ecc71' }}>Up to date</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}>
              <span>Replication Lag:</span>
              <strong>< 1ms</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <h4>Recent Alerts</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            No recent alerts
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
                  background: `${getAlertColor(alert.type)}20`,
                  border: `1px solid ${getAlertColor(alert.type)}40`,
                  borderRadius: '8px',
                  opacity: alert.resolved ? 0.6 : 1
                }}
              >
                <div>
                  <div style={{ 
                    color: getAlertColor(alert.type), 
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {alert.type.toUpperCase()}
                    {alert.resolved && ' (RESOLVED)'}
                  </div>
                  <div style={{ marginBottom: '5px' }}>{alert.message}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>
                {!alert.resolved && (
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    style={{ 
                      padding: '6px 12px', 
                      background: '#2ecc71', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};