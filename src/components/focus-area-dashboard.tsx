'use client';

import React, { useState, useEffect } from 'react';
import { userHistoryTrackingService } from '@/services/user-history-tracking-service';
import { gpt4FocusRecommendationsService, FocusRecommendation } from '@/services/gpt4-focus-recommendations-service';
import { gameIntegrationTracker, CrossGameAnalytics } from '@/services/game-integration-tracker';
import { personalizedRecommendationEngine, PersonalizedRecommendation } from '@/services/personalized-recommendation-engine';
import { useRealtimeUpdates, usePeerAchievements } from '@/hooks/use-realtime-updates';
import CelebrationEffects from '@/components/celebration-effects';

interface FocusAreaDashboardProps {
  userId: string;
  className?: string;
}

interface DashboardData {
  userAnalytics: any;
  crossGameAnalytics: CrossGameAnalytics | null;
  personalizedRecommendations: PersonalizedRecommendation[];
  learningTrajectory: any;
  effectivenessMetrics: any;
}

export default function FocusAreaDashboard({ userId, className = '' }: FocusAreaDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recommendations' | 'progress' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time updates integration
  const { 
    isConnected, 
    latestEvent, 
    celebration, 
    simulateBreakthrough 
  } = useRealtimeUpdates({
    userId,
    onBreakthrough: (event) => {
      console.log('🎉 Dashboard received breakthrough:', event);
      // Refresh data to show new breakthrough
      loadDashboardData();
    },
    onRecommendationUpdate: (event) => {
      console.log('📋 Dashboard received new recommendation:', event);
      // Update recommendations without full reload
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          personalizedRecommendations: [
            event.data.recommendation,
            ...dashboardData.personalizedRecommendations
          ].slice(0, 10) // Keep top 10
        });
      }
    },
    onMilestone: (event) => {
      console.log('🏆 Dashboard received milestone:', event);
      loadDashboardData();
    }
  });

  // Peer achievements for social learning
  const { peerAchievements } = usePeerAchievements();

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data
      const [
        userAnalytics,
        crossGameAnalytics,
        personalizedRecommendations,
        learningTrajectory,
        effectivenessMetrics
      ] = await Promise.all([
        userHistoryTrackingService.generateUserAnalytics(userId, 30),
        gameIntegrationTracker.getCrossGameAnalytics(userId),
        personalizedRecommendationEngine.getActiveRecommendations(userId),
        userHistoryTrackingService.getLearningTrajectory(userId),
        personalizedRecommendationEngine.getRecommendationEffectiveness(userId)
      ]);

      setDashboardData({
        userAnalytics,
        crossGameAnalytics,
        personalizedRecommendations,
        learningTrajectory,
        effectivenessMetrics
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateNewRecommendations = async () => {
    try {
      setRefreshing(true);
      await personalizedRecommendationEngine.generatePersonalizedRecommendations(userId);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to generate new recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className={`focus-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading focus area dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`focus-dashboard error ${className}`}>
        <div className="error-message">
          <h3>Unable to load dashboard</h3>
          <p>There was an issue loading the focus area dashboard. Please try again.</p>
          <button onClick={loadDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`focus-dashboard ${className}`}>
      {/* Celebration Effects */}
      {celebration.isActive && celebration.type && (
        <CelebrationEffects
          type={celebration.type}
          duration={celebration.duration}
          message={celebration.message}
        />
      )}
      
      {/* Real-time Connection Status */}
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢' : '🔴'} {isConnected ? 'Live Updates Active' : 'Offline Mode'}
        </span>
        {process.env.NODE_ENV === 'development' && (
          <button onClick={simulateBreakthrough} className="test-button">
            Test Breakthrough
          </button>
        )}
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2>🎯 Focus Area Dashboard</h2>
          <p className="subtitle">Personalized learning insights and recommendations</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={refreshDashboard}
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? '🔄' : '↻'} Refresh
          </button>
          <button 
            onClick={generateNewRecommendations}
            disabled={refreshing}
            className="generate-button"
          >
            ✨ New Recommendations
          </button>
        </div>
      </div>

      {/* Peer Achievements Bar */}
      {peerAchievements.length > 0 && (
        <div className="peer-achievements-bar">
          <div className="peer-achievement-scroll">
            {peerAchievements.map((achievement, index) => (
              <div key={index} className="peer-achievement">
                <span className="peer-icon">🌟</span>
                <span className="peer-message">{achievement.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { key: 'overview', label: '📊 Overview', icon: '📊' },
          { key: 'recommendations', label: '🎯 Recommendations', icon: '🎯' },
          { key: 'progress', label: '📈 Progress', icon: '📈' },
          { key: 'analytics', label: '🧠 Analytics', icon: '🧠' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`tab-button ${selectedTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <OverviewTab data={dashboardData} />
        )}
        {selectedTab === 'recommendations' && (
          <RecommendationsTab 
            recommendations={dashboardData.personalizedRecommendations}
            userId={userId}
          />
        )}
        {selectedTab === 'progress' && (
          <ProgressTab 
            userAnalytics={dashboardData.userAnalytics}
            learningTrajectory={dashboardData.learningTrajectory}
          />
        )}
        {selectedTab === 'analytics' && (
          <AnalyticsTab 
            crossGameAnalytics={dashboardData.crossGameAnalytics}
            effectivenessMetrics={dashboardData.effectivenessMetrics}
          />
        )}
      </div>

      <style jsx>{`
        .focus-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: relative;
        }

        .connection-status {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-indicator.connected {
          color: #28a745;
          border: 1px solid #28a745;
        }

        .status-indicator.disconnected {
          color: #dc3545;
          border: 1px solid #dc3545;
        }

        .test-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .test-button:hover {
          background: #5a6fd8;
        }

        .peer-achievements-bar {
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .peer-achievement-scroll {
          display: flex;
          gap: 24px;
          animation: scroll-left 30s linear infinite;
        }

        .peer-achievement {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: white;
          font-size: 14px;
        }

        .peer-icon {
          font-size: 18px;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .header-content h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        .subtitle {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-button, .generate-button {
          padding: 8px 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .refresh-button:hover, .generate-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .refresh-button:disabled, .generate-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dashboard-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: #f8f9fa;
          padding: 4px;
          border-radius: 12px;
        }

        .tab-button {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6c757d;
          transition: all 0.2s;
        }

        .tab-button.active {
          background: white;
          color: #495057;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.5);
        }

        .dashboard-content {
          min-height: 400px;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          gap: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 40px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          color: #721c24;
        }

        .retry-button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .retry-button:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .focus-dashboard {
            padding: 10px;
          }

          .dashboard-header {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .dashboard-tabs {
            flex-direction: column;
          }

          .tab-button {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data: DashboardData }) {
  const { userAnalytics, learningTrajectory, effectivenessMetrics } = data;

  return (
    <div className="overview-tab">
      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{userAnalytics.summary.total_sessions}</h3>
            <p>Learning Sessions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{Math.round(userAnalytics.summary.total_time_minutes / 60)}h</h3>
            <p>Total Practice Time</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{Math.round(effectivenessMetrics.success_rate)}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{userAnalytics.recent_breakthroughs.length}</h3>
            <p>Recent Breakthroughs</p>
          </div>
        </div>
      </div>

      {/* Learning Trajectory */}
      <div className="section">
        <h3>🎯 Learning Focus Areas</h3>
        <div className="focus-areas">
          <div className="strengths">
            <h4>💪 Strengths</h4>
            <ul>
              {learningTrajectory.strengths.map((strength: string, index: number) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          <div className="challenges">
            <h4>🎯 Focus Areas</h4>
            <ul>
              {learningTrajectory.challenges.map((challenge: string, index: number) => (
                <li key={index}>{challenge}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Engagement Trend */}
      <div className="section">
        <h3>📈 Engagement Trend</h3>
        <div className="trend-indicator">
          <div className={`trend-badge ${userAnalytics.summary.engagement_trend}`}>
            {userAnalytics.summary.engagement_trend === 'improving' && '📈 Improving'}
            {userAnalytics.summary.engagement_trend === 'stable' && '➡️ Stable'}
            {userAnalytics.summary.engagement_trend === 'declining' && '📉 Needs Attention'}
          </div>
          <p>Consistency Score: {Math.round(userAnalytics.summary.consistency_score)}%</p>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          gap: 16px;
        }

        .stat-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .stat-content p {
          margin: 4px 0 0 0;
          color: #666;
          font-size: 14px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .section h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 20px;
        }

        .focus-areas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .strengths, .challenges {
          padding: 16px;
          border-radius: 8px;
        }

        .strengths {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }

        .challenges {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }

        .strengths h4, .challenges h4 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .strengths ul, .challenges ul {
          margin: 0;
          padding-left: 20px;
        }

        .strengths li, .challenges li {
          margin-bottom: 8px;
          color: #555;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .trend-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 14px;
        }

        .trend-badge.improving {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .trend-badge.stable {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .trend-badge.declining {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
          .focus-areas {
            grid-template-columns: 1fr;
          }

          .trend-indicator {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ 
  recommendations, 
  userId 
}: { 
  recommendations: PersonalizedRecommendation[];
  userId: string;
}) {
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'immediate_action': return '⚡';
      case 'short_term_goal': return '🎯';
      case 'long_term_pathway': return '🛤️';
      case 'adaptive_adjustment': return '🔧';
      case 'breakthrough_acceleration': return '🚀';
      default: return '📝';
    }
  };

  return (
    <div className="recommendations-tab">
      <div className="recommendations-header">
        <h3>🎯 Personalized Recommendations</h3>
        <p>AI-powered suggestions tailored to your learning journey</p>
      </div>

      <div className="recommendations-list">
        {recommendations.map(rec => (
          <div key={rec.recommendation_id} className="recommendation-card">
            <div className="recommendation-header">
              <div className="rec-title-area">
                <span className="rec-type-icon">
                  {getRecommendationTypeIcon(rec.recommendation_type)}
                </span>
                <div>
                  <h4>{rec.title}</h4>
                  <p className="rec-description">{rec.description}</p>
                </div>
              </div>
              <div className="rec-meta">
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(rec.priority_level) }}
                >
                  {rec.priority_level.toUpperCase()}
                </span>
                <span className="confidence-score">
                  {rec.confidence_score}% confidence
                </span>
              </div>
            </div>

            <div className="recommendation-timing">
              <span>⏱️ {rec.optimal_timing.duration_minutes} minutes</span>
              <span>📅 {rec.optimal_timing.session_frequency}</span>
              {rec.optimal_timing.time_of_day && (
                <span>🕐 {rec.optimal_timing.time_of_day}</span>
              )}
            </div>

            <button
              className="expand-button"
              onClick={() => setExpandedRec(
                expandedRec === rec.recommendation_id ? null : rec.recommendation_id
              )}
            >
              {expandedRec === rec.recommendation_id ? 'Hide Details' : 'Show Details'}
            </button>

            {expandedRec === rec.recommendation_id && (
              <div className="recommendation-details">
                <div className="details-section">
                  <h5>🎯 Specific Actions</h5>
                  <ul>
                    {rec.specific_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div className="details-section">
                  <h5>🎉 Expected Outcomes</h5>
                  <ul>
                    {rec.expected_outcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>

                <div className="details-section">
                  <h5>🧠 Rationale</h5>
                  <p>{rec.rationale}</p>
                </div>

                {rec.implementation.game_activities.length > 0 && (
                  <div className="details-section">
                    <h5>🎮 Recommended Activities</h5>
                    <div className="game-activities">
                      {rec.implementation.game_activities.map((activity, index) => (
                        <div key={index} className="activity-card">
                          <span className="activity-name">{activity.activity_name}</span>
                          <span className="activity-meta">
                            Level {activity.difficulty_level} • {activity.estimated_duration}min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .recommendations-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .recommendations-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
        }

        .recommendations-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .rec-title-area {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .rec-type-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .rec-title-area h4 {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }

        .rec-description {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }

        .rec-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .confidence-score {
          font-size: 12px;
          color: #666;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .recommendation-timing {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #666;
        }

        .expand-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .expand-button:hover {
          background: #5a6fd8;
        }

        .recommendation-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        .details-section {
          margin-bottom: 16px;
        }

        .details-section h5 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .details-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .details-section li {
          margin-bottom: 4px;
          color: #555;
          font-size: 14px;
        }

        .details-section p {
          margin: 0;
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }

        .game-activities {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .activity-name {
          font-weight: 500;
          color: #333;
        }

        .activity-meta {
          font-size: 12px;
          color: #666;
        }

        @media (max-width: 768px) {
          .recommendation-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .rec-meta {
            flex-direction: row;
            align-items: center;
          }

          .recommendation-timing {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

// Progress Tab Component
function ProgressTab({ 
  userAnalytics, 
  learningTrajectory 
}: { 
  userAnalytics: any;
  learningTrajectory: any;
}) {
  return (
    <div className="progress-tab">
      <div className="progress-header">
        <h3>📈 Learning Progress</h3>
        <p>Track your skill development and milestones</p>
      </div>

      {/* Skill Progress */}
      <div className="section">
        <h4>🎯 Skill Mastery Levels</h4>
        <div className="skills-grid">
          {Array.from(userAnalytics.skill_progress.entries()).map(([skill, progress]: [string, any]) => (
            <div key={skill} className="skill-card">
              <div className="skill-header">
                <h5>{skill.replace('_', ' ').toUpperCase()}</h5>
                <span className="mastery-percentage">{Math.round(progress.mastery_percentage)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress.mastery_percentage}%` }}
                ></div>
              </div>
              <div className="skill-stats">
                <span>Level {progress.current_level}</span>
                <span>{progress.sessions_practiced} sessions</span>
                <span>{Math.round(progress.total_time_minutes / 60)}h practiced</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predicted Milestones */}
      <div className="section">
        <h4>🔮 Predicted Milestones</h4>
        <div className="milestones-list">
          {learningTrajectory.predictedMilestones.map((milestone: any, index: number) => (
            <div key={index} className="milestone-card">
              <div className="milestone-icon">🎯</div>
              <div className="milestone-content">
                <h5>{milestone.milestone}</h5>
                <p>{milestone.skill}</p>
                <div className="milestone-meta">
                  <span>📅 {milestone.estimatedDate.toLocaleDateString()}</span>
                  <span>🎯 {Math.round(milestone.confidence)}% confidence</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Breakthroughs */}
      {userAnalytics.recent_breakthroughs.length > 0 && (
        <div className="section">
          <h4>🎉 Recent Breakthroughs</h4>
          <div className="breakthroughs-list">
            {userAnalytics.recent_breakthroughs.map((breakthrough: any, index: number) => (
              <div key={index} className="breakthrough-card">
                <div className="breakthrough-icon">🚀</div>
                <div className="breakthrough-content">
                  <h5>{breakthrough.breakthrough_type.replace('_', ' ').toUpperCase()}</h5>
                  <p>in {breakthrough.skill_area}</p>
                  <span className="breakthrough-date">
                    {breakthrough.timestamp.toLocaleDateString()}
                  </span>
                </div>
                <div className="significance-score">
                  {breakthrough.significance_score}/10
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .progress-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .progress-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
        }

        .progress-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .section h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 20px;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .skill-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e9ecef;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .skill-header h5 {
          margin: 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .mastery-percentage {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .skill-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }

        .milestones-list, .breakthroughs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .milestone-card, .breakthrough-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .milestone-icon, .breakthrough-icon {
          font-size: 24px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 8px;
        }

        .milestone-content, .breakthrough-content {
          flex: 1;
        }

        .milestone-content h5, .breakthrough-content h5 {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .milestone-content p, .breakthrough-content p {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 14px;
        }

        .milestone-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #666;
        }

        .breakthrough-date {
          font-size: 12px;
          color: #666;
        }

        .significance-score {
          background: #667eea;
          color: white;
          padding: 8px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .skills-grid {
            grid-template-columns: 1fr;
          }

          .skill-stats {
            flex-direction: column;
            gap: 4px;
          }

          .milestone-meta {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ 
  crossGameAnalytics, 
  effectivenessMetrics 
}: { 
  crossGameAnalytics: CrossGameAnalytics | null;
  effectivenessMetrics: any;
}) {
  return (
    <div className="analytics-tab">
      <div className="analytics-header">
        <h3>🧠 Advanced Analytics</h3>
        <p>Deep insights into learning patterns and cross-game performance</p>
      </div>

      {/* Effectiveness Metrics */}
      <div className="section">
        <h4>📊 Recommendation Effectiveness</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{effectivenessMetrics.total_recommendations}</div>
            <div className="metric-label">Total Recommendations</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{Math.round(effectivenessMetrics.success_rate)}%</div>
            <div className="metric-label">Success Rate</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{effectivenessMetrics.average_engagement.toFixed(1)}/5</div>
            <div className="metric-label">Avg Engagement</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{effectivenessMetrics.breakthrough_acceleration_factor.toFixed(1)}x</div>
            <div className="metric-label">Breakthrough Rate</div>
          </div>
        </div>
      </div>

      {/* Cross-Game Performance */}
      {crossGameAnalytics && (
        <div className="section">
          <h4>🎮 Cross-Game Performance</h4>
          <div className="games-performance">
            {Array.from(crossGameAnalytics.game_performance.entries()).map(([game, stats]) => (
              <div key={game} className="game-performance-card">
                <h5>{game.replace('_', ' ').toUpperCase()}</h5>
                <div className="performance-stats">
                  <div className="stat">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">{stats.total_sessions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Accuracy</span>
                    <span className="stat-value">{Math.round(stats.average_accuracy)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Engagement</span>
                    <span className="stat-value">{Math.round(stats.engagement_score)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Consistency</span>
                    <span className="stat-value">{Math.round(stats.consistency_rating)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Transfer Insights */}
      {crossGameAnalytics && crossGameAnalytics.skill_transfer_analysis.length > 0 && (
        <div className="section">
          <h4>🔄 Skill Transfer Analysis</h4>
          <div className="transfer-insights">
            {crossGameAnalytics.skill_transfer_analysis.map((insight, index) => (
              <div key={index} className="transfer-card">
                <div className="transfer-header">
                  <span className="transfer-strength">
                    {Math.round(insight.transfer_strength)}% transfer strength
                  </span>
                </div>
                <div className="transfer-content">
                  <p>
                    <strong>{insight.source_game}</strong> → <strong>{insight.target_game}</strong>
                  </p>
                  <p>Skill area: {insight.skill_area}</p>
                  <div className="evidence-list">
                    {insight.evidence.map((evidence, idx) => (
                      <span key={idx} className="evidence-item">{evidence}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .analytics-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .analytics-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
        }

        .analytics-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .section h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 20px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-card {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          color: white;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .metric-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .games-performance {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .game-performance-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e9ecef;
        }

        .game-performance-card h5 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .performance-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .transfer-insights {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .transfer-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e9ecef;
        }

        .transfer-header {
          margin-bottom: 12px;
        }

        .transfer-strength {
          background: #667eea;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .transfer-content p {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 14px;
        }

        .evidence-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .evidence-item {
          background: white;
          border: 1px solid #e9ecef;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #666;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .games-performance {
            grid-template-columns: 1fr;
          }

          .performance-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}