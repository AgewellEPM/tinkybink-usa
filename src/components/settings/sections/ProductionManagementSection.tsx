'use client';

import { useState, useEffect } from 'react';
import { getComplianceTrackingService, getBackupService } from '@/modules/module-system';
import type { BackupMetadata, BackupSchedule } from '@/modules/data/backup-service';
import { HealthcareProductionDashboard } from '@/components/production/healthcare';

export function ProductionManagementSection() {
  const [backupService, setBackupService] = useState<ReturnType<typeof getBackupService> | null>(null);
  const [complianceService, setComplianceService] = useState<ReturnType<typeof getComplianceTrackingService> | null>(null);
  
  const [backupStatus, setBackupStatus] = useState('');
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState({ totalBackups: 0, totalSize: 0 });
  
  const [showDataProtection, setShowDataProtection] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showClinicalFeatures, setShowClinicalFeatures] = useState(false);
  const [showTestingHub, setShowTestingHub] = useState(false);
  const [showHealthcareProduction, setShowHealthcareProduction] = useState(false);
  
  const [complianceStatus, setComplianceStatus] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const backup = getBackupService();
      const compliance = getComplianceTrackingService();
      
      setBackupService(backup);
      setComplianceService(compliance);
      
      // Load backup data
      const backupList = backup.getBackups();
      setBackups(backupList);
      
      if (backupList.length > 0) {
        setLastBackup(new Date(backupList[0].createdAt));
      }
      
      // Check backup schedule
      const schedule = backup.getSchedule();
      if (schedule.enabled) {
        setBackupStatus(`Automatic ${schedule.frequency} backups enabled`);
      }
      
      // Load backup statistics
      const statistics = backup.getStatistics();
      setStats(statistics);
      
      // Load compliance status
      const status = compliance.getHIPAAComplianceStatus();
      setComplianceStatus(status);
    }
  }, []);

  const openDataProtection = () => {
    setShowDataProtection(true);
  };

  const openClinicalFeatures = () => {
    setShowClinicalFeatures(true);
  };

  const openBackupManager = () => {
    setShowBackupManager(true);
  };

  const openTestingHub = () => {
    setShowTestingHub(true);
  };

  const createBackup = async () => {
    if (!backupService) return;
    
    try {
      const backup = await backupService.createBackup({
        name: `Manual Backup ${new Date().toLocaleDateString()}`,
        description: 'User-initiated backup'
      });
      
      // Refresh backup list
      const updated = backupService.getBackups();
      setBackups(updated);
      setStats(backupService.getStatistics());
      
      if (updated.length > 0) {
        setLastBackup(new Date(updated[0].createdAt));
      }
      
      alert('Backup created successfully!');
    } catch (error) {
      alert('Failed to create backup: ' + (error as Error).message);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!backupService) return;
    
    const confirmed = confirm('Are you sure you want to restore this backup? Current data will be overwritten.');
    if (!confirmed) return;
    
    try {
      await backupService.restoreBackup(backupId);
      alert('Backup restored successfully! Please refresh the page.');
    } catch (error) {
      alert('Failed to restore backup: ' + (error as Error).message);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!backupService) return;
    
    const confirmed = confirm('Are you sure you want to delete this backup? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await backupService.deleteBackup(backupId);
      
      // Refresh backup list
      const updated = backupService.getBackups();
      setBackups(updated);
      setStats(backupService.getStatistics());
      
      alert('Backup deleted successfully!');
    } catch (error) {
      alert('Failed to delete backup: ' + (error as Error).message);
    }
  };

  return (
    <div className="settings-section">
      <h3>🏥 Production Management</h3>
      <div className="action-buttons">
        <button 
          className="action-btn" 
          onClick={() => setShowHealthcareProduction(true)}
          style={{ background: 'linear-gradient(135deg, #7b3ff2, #ff006e)' }}
        >
          <span style={{ fontSize: '16px' }}>🏢</span> Healthcare Production Dashboard
        </button>
        <button 
          className="action-btn" 
          onClick={openDataProtection}
          style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }}
        >
          <span style={{ fontSize: '16px' }}>🔒</span> Data Protection
        </button>
        <button 
          className="action-btn" 
          onClick={openClinicalFeatures}
          style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
        >
          <span style={{ fontSize: '16px' }}>⚕️</span> Clinical Features
        </button>
        <button 
          className="action-btn" 
          onClick={openBackupManager}
          style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)' }}
        >
          <span style={{ fontSize: '16px' }}>💾</span> Backup Manager
        </button>
        <button 
          className="action-btn" 
          onClick={openTestingHub}
          style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}
        >
          <span style={{ fontSize: '16px' }}>🧪</span> Testing Hub
        </button>
      </div>
      
      {lastBackup && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#2ecc71' }}>✓</span>
            Automatic daily backups with encryption
          </div>
        </div>
      )}

      {/* Data Protection Modal */}
      {showDataProtection && (
        <div className="modal" onClick={() => setShowDataProtection(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Data Protection Status</h2>
              <button className="close-btn" onClick={() => setShowDataProtection(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {complianceStatus && (
                <div>
                  <div className="compliance-grid">
                    <div className="compliance-item">
                      <span className="compliance-label">HIPAA Compliant:</span>
                      <span className={`compliance-status ${complianceStatus.hipaa?.compliant ? 'success' : 'danger'}`}>
                        {complianceStatus.hipaa?.compliant ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-label">Encryption:</span>
                      <span className={`compliance-status ${complianceStatus.hipaa?.details?.encryption ? 'success' : 'danger'}`}>
                        {complianceStatus.hipaa?.details?.encryption ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-label">Access Logs:</span>
                      <span className={`compliance-status ${complianceStatus.hipaa?.details?.accessLogging ? 'success' : 'danger'}`}>
                        {complianceStatus.hipaa?.details?.accessLogging ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-label">Data Retention:</span>
                      <span className={`compliance-status ${complianceStatus.hipaa?.details?.dataRetention ? 'success' : 'danger'}`}>
                        {complianceStatus.hipaa?.details?.dataRetention ? '✅ Configured' : '❌ Not Set'}
                      </span>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-label">Audit Trail:</span>
                      <span className={`compliance-status ${complianceStatus.hipaa?.details?.auditTrail ? 'success' : 'danger'}`}>
                        {complianceStatus.hipaa?.details?.auditTrail ? '✅ Complete' : '❌ Incomplete'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="features-section">
                    <h4>🛡️ Security Features</h4>
                    <ul>
                      <li>End-to-end encryption</li>
                      <li>Role-based access control</li>
                      <li>Automatic session timeout</li>
                      <li>Data anonymization</li>
                      <li>Secure API endpoints</li>
                      <li>Multi-factor authentication</li>
                      <li>Regular security audits</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Manager Modal */}
      {showBackupManager && (
        <div className="modal" onClick={() => setShowBackupManager(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2>💾 Backup Manager</h2>
              <button className="close-btn" onClick={() => setShowBackupManager(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="backup-stats">
                <div className="stat-card">
                  <h4>Total Backups</h4>
                  <p>{stats.totalBackups}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Size</h4>
                  <p>{(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="stat-card">
                  <h4>Latest Backup</h4>
                  <p>{lastBackup ? lastBackup.toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="stat-card">
                  <h4>Auto-Backup</h4>
                  <p>{backupStatus || 'Disabled'}</p>
                </div>
              </div>
              
              <div className="backup-actions">
                <button className="action-btn" onClick={createBackup}>
                  ➕ Create Backup
                </button>
              </div>
              
              <div className="backup-list">
                <h4>Recent Backups</h4>
                {backups.length === 0 ? (
                  <p>No backups found. Create your first backup above.</p>
                ) : (
                  <div className="backup-items">
                    {backups.slice(0, 10).map((backup) => (
                      <div key={backup.id} className="backup-item">
                        <div className="backup-info">
                          <div className="backup-name">{backup.name}</div>
                          <div className="backup-details">
                            {new Date(backup.createdAt).toLocaleString()} • {(backup.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <div className="backup-stats-mini">
                            {backup.statistics.boards} boards, {backup.statistics.tiles} tiles
                          </div>
                        </div>
                        <div className="backup-actions-mini">
                          <button 
                            className="action-btn secondary"
                            onClick={() => restoreBackup(backup.id)}
                          >
                            🔄 Restore
                          </button>
                          <button 
                            className="action-btn danger"
                            onClick={() => deleteBackup(backup.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Features Modal */}
      {showClinicalFeatures && (
        <div className="modal" onClick={() => setShowClinicalFeatures(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚕️ Clinical Features</h2>
              <button className="close-btn" onClick={() => setShowClinicalFeatures(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="features-section">
                <h4>🎯 Evidence-Based Tools</h4>
                <ul>
                  <li>Evidence-based interventions</li>
                  <li>Clinical decision support</li>
                  <li>Outcome measurement tools</li>
                  <li>Treatment plan templates</li>
                </ul>
              </div>
              
              <div className="features-section">
                <h4>📊 Progress Monitoring</h4>
                <ul>
                  <li>Real-time progress tracking</li>
                  <li>Visual progress reports</li>
                  <li>Goal achievement metrics</li>
                  <li>Parent/caregiver dashboards</li>
                </ul>
              </div>
              
              <div className="features-section">
                <h4>👥 Collaboration</h4>
                <ul>
                  <li>Peer review system</li>
                  <li>Clinical guidelines integration</li>
                  <li>Multi-disciplinary team support</li>
                  <li>Professional consultation tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testing Hub Modal */}
      {showTestingHub && (
        <div className="modal" onClick={() => setShowTestingHub(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧪 Testing Hub</h2>
              <button className="close-btn" onClick={() => setShowTestingHub(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="features-section">
                <h4>🤖 Automated Testing</h4>
                <ul>
                  <li>Automated test suites</li>
                  <li>Regression testing</li>
                  <li>Cross-browser compatibility</li>
                  <li>Mobile device testing</li>
                </ul>
              </div>
              
              <div className="features-section">
                <h4>📈 Performance Monitoring</h4>
                <ul>
                  <li>Real-time performance metrics</li>
                  <li>Load testing tools</li>
                  <li>Memory usage monitoring</li>
                  <li>Response time analysis</li>
                </ul>
              </div>
              
              <div className="features-section">
                <h4>🔍 Quality Assurance</h4>
                <ul>
                  <li>Error tracking and reporting</li>
                  <li>User acceptance testing</li>
                  <li>A/B testing framework</li>
                  <li>Accessibility compliance checker</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Healthcare Production Dashboard */}
      <HealthcareProductionDashboard 
        isOpen={showHealthcareProduction} 
        onClose={() => setShowHealthcareProduction(false)} 
      />

      <style jsx>{`
        .compliance-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .compliance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .compliance-label {
          font-weight: 500;
          color: #ddd;
        }
        
        .compliance-status {
          font-weight: 600;
        }
        
        .compliance-status.success {
          color: #2ecc71;
        }
        
        .compliance-status.danger {
          color: #e74c3c;
        }
        
        .backup-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .stat-card h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
        }
        
        .stat-card p {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: white;
        }
        
        .backup-actions {
          margin-bottom: 24px;
        }
        
        .backup-list h4 {
          margin-bottom: 16px;
          color: white;
        }
        
        .backup-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .backup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        
        .backup-info {
          flex: 1;
        }
        
        .backup-name {
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }
        
        .backup-details {
          font-size: 12px;
          color: #888;
          margin-bottom: 4px;
        }
        
        .backup-stats-mini {
          font-size: 11px;
          color: #666;
        }
        
        .backup-actions-mini {
          display: flex;
          gap: 8px;
        }
        
        .features-section {
          margin-bottom: 24px;
        }
        
        .features-section h4 {
          margin-bottom: 12px;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .features-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .features-section li {
          padding: 8px 0;
          color: #ddd;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .features-section li:last-child {
          border-bottom: none;
        }
        
        .features-section li::before {
          content: '•';
          color: #7b3ff2;
          margin-right: 8px;
        }
        
        .action-btn.danger {
          background: #e74c3c;
        }
        
        .action-btn.danger:hover {
          background: #c0392b;
        }
      `}</style>
    </div>
  );
}