'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPerformanceMetricsService,
  getUsagePatternsService,
  getReportGenerationService 
} from '@/modules/module-system';

interface DashboardStats {
  overallScore: number;
  sessionsToday: number;
  averageWPM: number;
  accuracyRate: number;
  totalMilestones: number;
  activeGoals: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    overallScore: 0,
    sessionsToday: 0,
    averageWPM: 0,
    accuracyRate: 0,
    totalMilestones: 0,
    activeGoals: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<Array<{
    id: string;
    message: string;
    severity: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const performanceService = getPerformanceMetricsService();
        const patternsService = getUsagePatternsService();
        
        // Get performance metrics
        const metrics = performanceService.getAllMetrics();
        const wpmMetric = metrics.find(m => m.id === 'words_per_minute');
        const accuracyMetric = metrics.find(m => m.id === 'accuracy_rate');
        
        // Get recent sessions
        const sessions = patternsService.getSessionHistory(10);
        const today = new Date().toDateString();
        const todaySessions = sessions.filter(s => 
          s.startTime.toDateString() === today
        );
        
        // Get milestones and goals
        const milestones = performanceService.getMilestones();
        const goals = performanceService.getGoals();
        const alerts = performanceService.getAlerts(true); // Unacknowledged only
        
        // Generate performance report
        const report = await performanceService.generatePerformanceReport();
        
        setStats({
          overallScore: Math.round(report.summary.overallScore || 75),
          sessionsToday: todaySessions.length,
          averageWPM: Math.round(wpmMetric?.value || 25),
          accuracyRate: Math.round(accuracyMetric?.value || 85),
          totalMilestones: milestones.length,
          activeGoals: goals.length
        });
        
        setRecentAlerts(alerts.slice(0, 3));
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading analytics:', error);
        setIsLoading(false);
      }
    };

    loadAnalytics();
    
    // Update every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateQuickReport = async () => {
    try {
      const reportService = getReportGenerationService();
      
      // Create a quick progress report
      const report = await reportService.generateReport('progress-report', {
        format: 'html'
      });
      
      // In a real app, this would open the report in a new window or download it
      console.log('Generated report:', report);
      alert('Quick report generated! Check the console for details.');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Check console for details.');
    }
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner">📊 Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="dashboard-actions">
          <button 
            className="action-btn"
            onClick={generateQuickReport}
            title="Generate Progress Report"
          >
            📄 Quick Report
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overallScore}%</div>
            <div className="stat-label">Overall Score</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.sessionsToday}</div>
            <div className="stat-label">Sessions Today</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageWPM}</div>
            <div className="stat-label">Words/Min</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.accuracyRate}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalMilestones}</div>
            <div className="stat-label">Milestones</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎲</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeGoals}</div>
            <div className="stat-label">Active Goals</div>
          </div>
        </div>
      </div>
      
      {recentAlerts.length > 0 && (
        <div className="alerts-section">
          <h3>🔔 Recent Alerts</h3>
          <div className="alerts-list">
            {recentAlerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity}`}>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="analytics-features">
        <h3>🚀 Advanced Analytics Features</h3>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔮</div>
            <div className="feature-content">
              <h4>Predictive Analytics</h4>
              <p>AI-powered predictions for next words and learning paths</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <div className="feature-content">
              <h4>Usage Patterns</h4>
              <p>Detailed analysis of communication patterns and habits</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-content">
              <h4>Performance Metrics</h4>
              <p>Real-time tracking of speed, accuracy, and progress</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <h4>Data Visualization</h4>
              <p>Interactive charts, dashboards, and visual reports</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <div className="feature-content">
              <h4>Report Generation</h4>
              <p>Automated reports for progress, clinical, and educational use</p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .analytics-dashboard {
          padding: 20px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .dashboard-header h2 {
          color: #7B3FF2;
          margin: 0;
          font-size: 24px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        .loading-spinner {
          font-size: 20px;
          color: #7B3FF2;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }
        
        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
        
        .stat-card.primary {
          background: linear-gradient(135deg, #7B3FF2, #FF006E);
          border-color: transparent;
        }
        
        .stat-icon {
          font-size: 24px;
          opacity: 0.8;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: white;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 4px;
        }
        
        .alerts-section {
          margin-bottom: 30px;
        }
        
        .alerts-section h3 {
          color: #FF6B6B;
          margin-bottom: 12px;
          font-size: 16px;
        }
        
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .alert {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 6px;
          padding: 12px;
        }
        
        .alert-high {
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.5);
        }
        
        .alert-message {
          font-size: 14px;
          color: white;
          margin-bottom: 4px;
        }
        
        .alert-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .analytics-features h3 {
          color: #4ECDC4;
          margin-bottom: 16px;
          font-size: 18px;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          gap: 12px;
          transition: all 0.2s ease;
        }
        
        .feature-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: #7B3FF2;
        }
        
        .feature-icon {
          font-size: 32px;
          opacity: 0.8;
        }
        
        .feature-content h4 {
          color: white;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        
        .feature-content p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .action-btn {
          background: linear-gradient(135deg, #4ECDC4, #44A08D);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        }
      `}</style>
    </div>
  );
}