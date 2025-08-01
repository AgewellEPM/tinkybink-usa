'use client';

import { useState } from 'react';
import { getAnalyticsService, getDashboardService, getComplianceService } from '@/modules/module-system';
import { useAppStore } from '@/store/app-store';

export function AnalyticsSection() {
  const [status, setStatus] = useState('');
  const { setCurrentView } = useAppStore();

  const showAnalyticsDashboard = () => {
    const analyticsService = getAnalyticsService();
    const stats = analyticsService.getAnalyticsSummary();
    
    // For now, show in an alert - later this would open a modal
    alert(`📊 Usage Statistics\n\n` +
      `Total Sessions: ${stats.totalSessions}\n` +
      `Total Events: ${stats.totalEvents}\n` +
      `Tiles Selected: ${stats.tilesSelected}\n` +
      `Boards Created: ${stats.boardsCreated}\n` +
      `Games Played: ${stats.gamesPlayed}\n` +
      `Average Session: ${Math.round(stats.averageSessionDuration / 60000)}min\n` +
      `Most Used Board: ${stats.mostUsedBoard || 'None'}\n` +
      `Peak Usage Time: ${stats.peakUsageTime || 'N/A'}`
    );
  };

  const showProfessionalReports = () => {
    // Switch to professional dashboard view
    setCurrentView('dashboard');
    setStatus('Opened Professional Dashboard');
    
    // Close settings panel
    window.dispatchEvent(new Event('toggleSettings'));
  };

  const exportAnalytics = async () => {
    const analyticsService = getAnalyticsService();
    setStatus('Exporting analytics...');
    
    try {
      const data = analyticsService.exportAnalytics();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tinkybink_analytics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus('Analytics exported successfully!');
    } catch (error) {
      setStatus('Export failed. Please try again.');
    }
  };

  const clearAnalytics = () => {
    if (!confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      return;
    }
    
    const analyticsService = getAnalyticsService();
    analyticsService.clearAnalytics();
    setStatus('Analytics data cleared');
  };

  const generateComplianceReport = () => {
    const complianceService = getComplianceService();
    const report = complianceService.generateComplianceReport();
    
    // For now, show summary in alert
    alert(`🏥 HIPAA Compliance Report\n\n` +
      `Compliant: ${report.isCompliant ? '✅ Yes' : '❌ No'}\n` +
      `Score: ${report.score}%\n` +
      `Checks Passed: ${report.checksPassed}/${report.totalChecks}\n\n` +
      `Key Areas:\n` +
      `• Data Encryption: ${report.details.dataEncryption.status}\n` +
      `• Access Control: ${report.details.accessControl.status}\n` +
      `• Audit Logging: ${report.details.auditLogging.status}\n` +
      `• Data Backup: ${report.details.dataBackup.status}\n\n` +
      `Generated: ${new Date(report.generatedAt).toLocaleString()}`
    );
  };

  return (
    <div className="settings-section">
      <h3>📊 Analytics & Professional Reports</h3>
      
      <div className="action-buttons">
        <button className="action-btn" onClick={showAnalyticsDashboard}>
          📈 View Usage Stats
        </button>
        <button className="action-btn professional" onClick={showProfessionalReports}>
          <span className="btn-icon">🏥</span>
          <span className="btn-text">Professional Reports</span>
        </button>
        <button className="action-btn secondary" onClick={exportAnalytics}>
          📥 Export Analytics
        </button>
        <button className="action-btn secondary" onClick={generateComplianceReport}>
          🔒 Compliance Report
        </button>
        <button 
          className="action-btn secondary" 
          onClick={clearAnalytics}
          style={{ background: 'rgba(231, 76, 60, 0.2)', borderColor: '#e74c3c' }}
        >
          🗑️ Clear Analytics
        </button>
      </div>
      
      {status && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          {status}
        </div>
      )}
    </div>
  );
}